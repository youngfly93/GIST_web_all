# 构建阶段
FROM node:18-alpine as builder

WORKDIR /app

# 复制 package.json 文件
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# 安装依赖
RUN npm run install:all

# 复制源代码
COPY . .

# 构建前端
RUN cd frontend && npm run build

# 运行阶段
FROM node:18-alpine

WORKDIR /app

# 只安装生产依赖
COPY package*.json ./
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# 复制构建好的文件和源代码
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY backend ./backend

# 暴露端口
EXPOSE 8000

# 启动应用
CMD ["node", "backend/src/index.js"]