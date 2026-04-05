# 组件设计示例

## 按钮系统

### 1. 主按钮 (Primary Button)
用于最重要的操作，如提交表单、开始主要流程。

```jsx
<button className="btn-primary">
  快速开始一次投递
</button>

/* 样式定义 */
.btn-primary {
  @apply bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold
         shadow-md hover:bg-blue-700 hover:shadow-lg
         active:scale-[0.98] transition-all duration-200
         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
}
```

### 2. 次按钮 (Secondary Button)
用于次要操作，如返回、取消、辅助操作。

```jsx
<button className="btn-secondary">
  返回首页
</button>

/* 样式定义 */
.btn-secondary {
  @apply bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-lg font-medium
         shadow-sm hover:bg-blue-50 hover:shadow-md
         active:scale-[0.98] transition-all duration-200
         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
}
```

### 3. 文字按钮 (Text Button)
用于最不重要的操作，如链接、详细信息。

```jsx
<button className="btn-text">
  查看详情
</button>

/* 样式定义 */
.btn-text {
  @apply text-blue-600 font-medium hover:text-blue-800
         underline-offset-4 hover:underline
         transition-colors duration-200
         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded;
}
```

### 4. 危险按钮 (Danger Button)
用于删除、取消等危险操作。

```jsx
<button className="btn-danger">
  删除记录
</button>

/* 样式定义 */
.btn-danger {
  @apply bg-red-600 text-white px-6 py-3 rounded-lg font-semibold
         shadow-md hover:bg-red-700 hover:shadow-lg
         active:scale-[0.98] transition-all duration-200
         focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2;
}
```

## 卡片设计

### 1. 主要信息卡片
用于展示核心内容，如分析结果、主要功能。

```jsx
<div className="card-primary">
  <h3 className="text-xl font-semibold text-slate-900">Resume Assistant</h3>
  <p className="mt-2 text-slate-600">先解决这次投递要写什么，再决定是否记录和复盘。</p>
  <button className="btn-primary mt-4">快速开始</button>
</div>

/* 样式定义 */
.card-primary {
  @apply bg-white rounded-3xl border border-slate-200 p-8
         shadow-lg shadow-slate-200/50
         backdrop-blur-sm;
}
```

### 2. 次要信息卡片
用于辅助内容，如使用说明、提示信息。

```jsx
<div className="card-secondary">
  <h4 className="text-lg font-medium text-slate-900">使用说明</h4>
  <ol className="mt-3 space-y-2 text-slate-600">
    <li>1. 点击"快速开始一次投递"</li>
    <li>2. 选择简历并粘贴JD</li>
  </ol>
</div>

/* 样式定义 */
.card-secondary {
  @apply bg-slate-50/80 rounded-2xl border border-slate-200 p-6
         shadow-md;
}
```

### 3. 深色主题卡片
用于强调或特殊区域。

```jsx
<div className="card-dark">
  <h4 className="text-lg font-medium text-white">匹配分析结果</h4>
  <p className="mt-2 text-slate-300">您的简历与岗位匹配度为85%</p>
</div>

/* 样式定义 */
.card-dark {
  @apply bg-slate-900 text-white rounded-3xl p-8
         shadow-xl shadow-slate-900/30;
}
```

## 表单元素

### 1. 文本输入框
```jsx
<label className="block space-y-2">
  <span className="text-sm font-medium text-slate-700">公司名称</span>
  <input
    type="text"
    className="input-primary"
    placeholder="请输入公司名称"
  />
</label>

/* 样式定义 */
.input-primary {
  @apply block w-full rounded-xl border border-slate-300 bg-white px-4 py-3
         text-slate-900 placeholder:text-slate-500
         focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
         transition-all duration-200;
}
```

### 2. 下拉选择框
```jsx
<label className="block space-y-2">
  <span className="text-sm font-medium text-slate-700">选择简历</span>
  <select className="select-primary">
    <option value="">请选择简历</option>
    <option value="1">前端开发工程师简历.pdf</option>
  </select>
</label>

/* 样式定义 */
.select-primary {
  @apply block w-full rounded-xl border border-slate-300 bg-white px-4 py-3
         text-slate-900
         focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
         transition-all duration-200;
}
```

### 3. 文本区域
```jsx
<label className="block space-y-2">
  <span className="text-sm font-medium text-slate-700">岗位JD</span>
  <textarea
    rows={4}
    className="textarea-primary"
    placeholder="粘贴岗位描述..."
  />
</label>

/* 样式定义 */
.textarea-primary {
  @apply block w-full rounded-xl border border-slate-300 bg-white px-4 py-3
         text-slate-900 placeholder:text-slate-500
         focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
         transition-all duration-200 resize-y;
}
```

## 布局组件

### 1. 页面头部
```jsx
<header className="page-header">
  <div>
    <p className="text-xs uppercase tracking-widest text-blue-600">开始投递</p>
    <h1 className="mt-2 text-3xl font-bold text-slate-900">根据目标岗位，快速生成投递内容</h1>
  </div>
  <div className="flex gap-3">
    <button className="btn-secondary">返回首页</button>
    <button className="btn-text">退出登录</button>
  </div>
</header>

/* 样式定义 */
.page-header {
  @apply flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/90 p-8
         shadow-lg shadow-slate-200/50 backdrop-blur-sm
         sm:flex-row sm:items-center sm:justify-between;
}
```

### 2. 内容区域
```jsx
<section className="content-section">
  <div className="section-header">
    <p className="text-xs uppercase tracking-widest text-slate-500">核心任务</p>
    <h2 className="mt-2 text-2xl font-semibold text-slate-900">开始一次投递准备</h2>
  </div>
  <div className="section-content">
    {/* 表单内容 */}
  </div>
</section>

/* 样式定义 */
.content-section {
  @apply rounded-3xl border border-slate-200 bg-white/80 p-8
         shadow-lg shadow-slate-200/30;
}

.section-header {
  @apply mb-6;
}

.section-content {
  @apply space-y-6;
}
```

## 响应式设计

### 断点策略
- 移动端: `< 640px` - 单列布局，简化卡片
- 平板: `640px - 1024px` - 两列布局，适中间距
- 桌面端: `> 1024px` - 多列布局，完整功能

### 响应式类示例
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* 卡片内容 */}
</div>
```

## 交互反馈

### 1. 加载状态
```jsx
<button className="btn-primary" disabled>
  <span className="flex items-center gap-2">
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
      {/* 加载图标 */}
    </svg>
    处理中...
  </span>
</button>
```

### 2. 成功提示
```jsx
<div className="alert-success">
  <svg>{/* 成功图标 */}</svg>
  <span>投递内容已成功生成！</span>
</div>

/* 样式定义 */
.alert-success {
  @apply flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 p-4
         text-green-800;
}
```

### 3. 错误提示
```jsx
<div className="alert-error">
  <svg>{/* 错误图标 */}</svg>
  <span>请先选择一份简历</span>
</div>

/* 样式定义 */
.alert-error {
  @apply flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 p-4
         text-red-800;
}
```

## 实施建议

### 1. 创建样式工具类
在 `globals.css` 中添加自定义工具类：

```css
@layer components {
  .btn-primary { /* ... */ }
  .btn-secondary { /* ... */ }
  .card-primary { /* ... */ }
  .input-primary { /* ... */ }
}
```

### 2. 使用CSS变量
在 `:root` 中定义颜色变量，确保一致性。

### 3. 组件化开发
将常用组件提取为React组件，如 `<Button>`、`<Card>`、`<Input>`。

### 4. 渐进式更新
从主页开始，逐步更新各个页面，确保用户体验连贯。