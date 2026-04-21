1 | 参考色（Logo 主色）
角色	HEX	RGB	说明
Primary-500	#1C484C	28 72 76	Logo 线条与文字色，作为品牌主色

2 | 同色系（主色的明暗层级）
Token	HEX	用途举例
Primary-900	#0F2B2E	顶部导航背景 / 按钮悬停深色
Primary-700	#163A3D	主要按钮填充、选中标签
Primary-500	#1C484C	标准按钮 / 链接 / 图标
Primary-300	#3C6B6F	图表柱状 / 信息突出底色
Primary-100	#D7E4E5	表格行 hover / 次要 Badge 背景
Primary-050	#F2F7F7	版面大面积浅背景、卡片填充

做法：在 HSL 空间保持 Hue≈185°，改变 Lightness 来获得统一的深浅层级。

3 | 辅助与强调色
角色	HEX	配色思路 & 典型场景
Accent-Coral	#E87D4C	与主色互补（红橙系），用于 CTA 按钮、关键指标；小面积高对比度
Accent-Lime	#9CCB3B	类似医疗/生命科学氛围，点缀图标、成功提示
Accent-Sky	#2F8FBF	主色的邻近色，数据可视化第二序列

建议一个醒目的暖色（Coral）+ 一个柔和的冷色（Sky/Lime）即可，避免色彩过多。

4 | 中性色（文字 & 背景）
Token	HEX	用途示例
Gray-900	#1A1A1A	正文深色文字
Gray-700	#444444	次级文字 / 图标
Gray-500	#8A8A8A	占位符 / 辅助说明文字
Gray-200	#E5E5E5	分隔线 / 表格边框
Gray-050	#FAFAFA	页面默认背景

5 | 样板：CSS 设计变量
css
复制
编辑
:root {
  /* Brand Primary */
  --clr-primary-900: #0F2B2E;
  --clr-primary-700: #163A3D;
  --clr-primary-500: #1C484C;
  --clr-primary-300: #3C6B6F;
  --clr-primary-100: #D7E4E5;
  --clr-primary-050: #F2F7F7;

  /* Accent */
  --clr-accent-coral: #E87D4C;
  --clr-accent-lime : #9CCB3B;
  --clr-accent-sky  : #2F8FBF;

  /* Neutrals */
  --clr-gray-900: #1A1A1A;
  --clr-gray-700: #444444;
  --clr-gray-500: #8A8A8A;
  --clr-gray-200: #E5E5E5;
  --clr-gray-050: #FAFAFA;
}
6 | 组件配色示例
组件	背景	文字 / 图标	描边 / 阴影
主按钮	--clr-primary-500	#FFFFFF	阴影：Primary-700 透明度 20 %
次按钮	transparent	--clr-primary-500	1 px --clr-primary-500
CTA 按钮	--clr-accent-coral	#FFFFFF	阴影：Accent-Coral 深化
卡片	#FFFFFF	正文 --clr-gray-900	圆角 12 px；1 px --clr-gray-200
页首导航	--clr-primary-900	链接 #FFFFFF	
图表系列 1	--clr-primary-500	—	
图表系列 2	--clr-accent-sky	—	

7 | 无障碍 & 对比度
主按钮文字（白）与 Primary-500（#1C484C）对比 ≈ 5.7 : 1 ✔︎

正文深灰 (#1A1A1A) 与背景白 (#FAFAFA) 对比 ≈ 14.7 : 1 ✔︎

如在浅背景使用浅色文字，确保对比度 ≥ 4.5 : 1，必要时改用深色文字或加深背景。

8 | 快速配色指南
保持一致 – 所有交互主色、重要图标统一使用 Primary-500。

暖色点睛 – 只在需要用户关注的区域（CTA、警告）使用 Accent-Coral。

大面积留白 – 深色 Logo+按钮 + 大面积浅灰/白背景，凸显极简。

图表区分 – 先用主色不同明度区分序列，再用 Accent-Sky / Lime 做补充。

可访问性优先 – 每个前景/背景组合先跑 WCAG 对比度测试。

这样，整个站点即可与深青绿色 Logo 保持统一，又具备活力与层次。祝你的 GIST AI 页面设计顺利！