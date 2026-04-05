# 首页页面结构修改计划

## 项目概述
修改 `src/app/page.tsx` 中的首页布局，优化顶部核心区和底部功能区的视觉设计。

## 当前状态分析
1. **顶部核心区**：使用 `lg:grid-cols-[1.25fr_0.75fr]` (62.5%:37.5%)，接近但未达到65%:35%
2. **左侧卡片**：包含两个按钮，需要简化为一个
3. **高度对齐**：左右卡片高度可能不一致
4. **底部功能区**：四个卡片布局基本合理，但需要统一尺寸和对齐
5. **按钮样式**：部分按钮已经是黑色背景白色字体，但需要确保所有按钮一致

## 具体修改方案

### 1. 顶部核心区修改
**目标**：65%:35%比例，高度对齐，单按钮设计

**修改内容**：
```tsx
// 修改第24行的网格比例
<section className="grid gap-6 lg:grid-cols-[65%_35%]">

// 修改左侧卡片按钮区域（第33-40行），只保留一个按钮
<div className="mt-8">
  <Link href={primaryHref} className="rounded-full bg-slate-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-800">
    {primaryLabel}
  </Link>
</div>

// 添加高度对齐样式
<section className="grid gap-6 lg:grid-cols-[65%_35%] items-stretch">
```

### 2. 底部功能区修改
**目标**：四个卡片尺寸、间距、对齐完全一致，按钮靠下对齐

**修改内容**：
```tsx
// 修改卡片容器（第62行），添加等高等宽约束
<div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4 auto-rows-fr">

// 修改单个卡片（第64-70行），添加flex布局确保按钮靠下
<article key={item.title} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] flex flex-col h-full">
  <div className="flex-grow">
    <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
    <p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p>
  </div>
  <div className="mt-4">
    <Link href={item.href} className="inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
      进入
    </Link>
  </div>
</article>
```

### 3. 全局样式调整
**目标**：整体容器居中，统一圆角和外边距，响应式栅格

**修改内容**：
```tsx
// 主容器已居中（第23行），无需修改
<section className="mx-auto flex w-full max-w-6xl flex-col gap-8">

// 确保所有卡片使用一致的圆角
// 当前：顶部卡片 rounded-[32px]，底部卡片 rounded-[24px]
// 建议统一为 rounded-3xl (24px) 或保持现状

// 确保所有按钮黑色背景白色字体
// 检查所有按钮类名包含：bg-slate-950 text-white
```

### 4. 响应式设计
**目标**：在不同屏幕宽度下保持栅格比例

**修改内容**：
```tsx
// 顶部核心区：小屏幕垂直堆叠，大屏幕65%:35%
<section className="grid gap-6 md:grid-cols-1 lg:grid-cols-[65%_35%] items-stretch">

// 底部功能区：小屏幕1列，中屏幕2列，大屏幕4列
<div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 auto-rows-fr">
```

## 实施步骤
1. 备份当前 `src/app/page.tsx` 文件
2. 修改顶部核心区网格比例和按钮
3. 添加高度对齐样式
4. 修改底部功能区卡片布局
5. 测试不同屏幕尺寸下的响应式表现
6. 验证所有按钮样式一致性

## 预期效果
1. 顶部核心区精确65%:35%比例，高度对齐
2. 左侧只显示"快速开始一次投递"按钮
3. 底部四个卡片尺寸、间距、对齐完全一致
4. 所有按钮黑色背景白色字体
5. 整体布局居中，视觉层次清晰

## 技术考虑
- 使用Tailwind CSS v4，支持 `auto-rows-fr` 等现代特性
- 保持现有设计语言和品牌一致性
- 确保无障碍访问性不受影响
- 兼容现有用户登录状态逻辑