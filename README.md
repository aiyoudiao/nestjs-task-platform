# NestJS Gray Data Async Task Platform

生产可用、保持最小复杂度的异步任务系统，用于灰度数据导入。

## 1. 项目结构

```text
apps
├─ api
│  └─ src
│     ├─ app.module.ts
│     ├─ main.ts
│     ├─ queue-ui
│     │  └─ queue-ui.module.ts
│     └─ tasks
│        ├─ dto/import-gray-data.dto.ts
│        ├─ tasks.controller.ts
│        ├─ tasks.module.ts
│        └─ tasks.service.ts
└─ worker
   └─ src
      ├─ main.ts
      ├─ worker.module.ts
      └─ processors/gray-data-import.processor.ts

libs
├─ config
│  └─ src
│     ├─ config.module.ts
│     └─ env.validation.ts
├─ queue
│  └─ src
│     ├─ queue.constants.ts
│     ├─ queue.module.ts
│     └─ queue.types.ts
└─ tablestore
   └─ src
      ├─ tablestore.module.ts
      └─ tablestore.service.ts
```

## 2. 核心架构

Client → API (`POST /tasks/import-gray-data`) → BullMQ Queue (`gray-data-import`) → Worker → TableStore。

- API 不阻塞：仅入队，返回 `202 Accepted`
- Worker 异步执行：`concurrency=3`
- 限流：`limiter max=50, duration=1000`
- 重试：`attempts=3` + 指数退避 `delay=2000`
- 失败追踪：超过重试次数进入 Dead Letter Queue (`gray-data-import-dead`)
- 可观测：Bull Board `/admin/queues`

## 3. QueueModule 示例

`libs/queue/src/queue.module.ts` 配置：

- `gray-data-import`
  - `attempts: 3`
  - `backoff: exponential / 2000`
  - `limiter: { max: 50, duration: 1000 }`
- `gray-data-import-dead`
  - 失败任务归档队列

## 4. Producer 示例

`apps/api/src/tasks/tasks.service.ts`

- 按 `batch size = 100` 拆分 records。
- 使用 `queue.addBulk()` 生成多任务。
- 返回 `totalBatches + jobIds`。

## 5. Worker Processor 示例

`apps/worker/src/processors/gray-data-import.processor.ts`

- `@Processor('gray-data-import', { concurrency: 3 })`
- `process()` 中调用 `TableStoreService.writeBatch()`
- `@OnWorkerEvent('failed')` 监听失败任务并在最大重试后写入 dead queue

## 6. TableStoreService 示例

`libs/tablestore/src/tablestore.service.ts`

- 使用 `tablestore` 的 `BatchWriteRow`
- 每 job 写 100 行（由 batch 切片保证）
- 对 `partial failure` 主动抛错，交由 BullMQ retry

## 7. Bull Board 集成

`apps/api/src/queue-ui/queue-ui.module.ts`

- 当前已按要求临时注释 Bull Board 相关代码并移除 `@bull-board/api` 依赖
- 如需恢复，请重新安装 `@bull-board/api` 并恢复 `apps/api/src/queue-ui/queue-ui.module.ts` 中实现

## 8. Dead Letter Queue 示例

Worker `onFailed` 中逻辑：

- 当 `attemptsMade >= attempts` 时，把失败任务 payload 写入 `gray-data-import-dead`
- 便于后续人工排查、补偿任务

## 9. Docker Compose (Redis)

```bash
docker compose up -d
```

使用 `redis:7`，默认映射 `6379`。

## 10. 运行步骤

1. 安装依赖
   ```bash
   pnpm install
   ```
2. 启动 Redis
   ```bash
   docker compose up -d
   ```
3. 准备环境变量
   ```bash
   cp .env.example .env
   ```
4. 启动 API（开发模式）
   ```bash
   pnpm start:api
   ```
5. 启动 Worker（开发模式）
   ```bash
   pnpm start:worker
   ```

## 11. API 调用示例

```bash
curl -X POST http://localhost:3000/tasks/import-gray-data \
  -H 'Content-Type: application/json' \
  -d '{
    "records": [
      {"id": "u-1", "name": "alice", "score": 98},
      {"id": "u-2", "name": "bob", "score": 87}
    ]
  }'
```

> 注意：正式场景中 records 数量应为 1000~50000。
