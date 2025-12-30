# miRNA查询功能实现策略

## 概述
基于 `hsa_MTI.csv` 文件实现的miRNA查询功能，提供快速、准确的基因-miRNA关系查询服务。

## 核心架构

### 1. 数据处理层
- **文件位置**: `backend/hsa_MTI.csv` (317MB, 635条TP53相关记录)
- **加载策略**: 服务启动时一次性加载到内存，避免重复磁盘IO
- **数据结构**: JSON对象数组，支持快速过滤查询

```javascript
// 数据映射结构
{
  'miRTarBase ID': 'MIRT003105',
  'miRNA': 'hsa-miR-122-5p', 
  'Target Gene': 'SLC7A1',     // 查询键
  'Support Type': 'Functional MTI',
  'Experiments': 'Luciferase reporter assay//Western blot',
  'References (PMID)': '17179747'
}
```

### 2. API路由策略
- **端点**: `GET /api/ncrna/query?gene={gene}&type=miRNA`
- **类型分发**: miRNA查询使用CSV数据，其他类型使用JSON数据
- **查询算法**: O(n)内存过滤，毫秒级响应

### 3. 前端交互流程
1. **首页选择**: 用户选择miRNA类型并输入基因名
2. **路由跳转**: 跳转到专门的 `/mirna-results` 页面
3. **数据获取**: 异步调用API获取查询结果
4. **表格展示**: 列表形式展示，支持搜索筛选

## 技术特点

### 性能优化
- **内存缓存**: 数据常驻内存，查询速度快
- **一次加载**: 避免重复文件读取
- **响应式设计**: 移动端自适应隐藏次要列

### 用户体验
- **专门页面**: 适合大量数据展示和操作
- **表格布局**: 信息密度高，便于比较
- **实时搜索**: 支持miRNA ID和证据类型筛选

### 数据完整性
- **标准化格式**: 统一的JSON响应格式
- **外部链接**: 自动生成miRBase和PubMed链接
- **错误处理**: 完善的异常处理和用户提示

## 关键文件

```
backend/
├── src/services/ncRNAService.js    # 数据加载和查询逻辑
├── src/routes/ncrna.js             # API路由定义
└── hsa_MTI.csv                     # miRNA数据源

frontend/
├── src/pages/Home.tsx              # 首页查询入口
├── src/pages/MiRNAResults.tsx      # 结果展示页面
└── src/App.css                     # 样式定义
```

## 扩展策略

### 数据更新
- 支持热更新CSV数据，无需重启服务
- 可扩展支持多个数据源文件

### 功能增强
- 可添加查询结果缓存机制
- 支持按Target Gene建立索引优化查询
- 可集成更多miRNA数据库

## 部署要求
- **内存**: 建议至少1GB可用内存
- **存储**: CSV文件需要稳定的文件系统访问
- **网络**: 外部链接需要互联网连接

## 监控指标
- CSV文件加载状态
- 内存使用情况
- 查询响应时间
- 错误率统计
