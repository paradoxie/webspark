// 标签颜色工具函数
export const getTagColorClasses = (color?: string) => {
  if (!color) {
    return 'bg-gray-50 text-gray-700 border-gray-200';
  }

  // 支持从数据库传来的color值，可以是颜色名称或hex值
  const colorLowerCase = color.toLowerCase();

  // 预定义的颜色映射
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    pink: 'bg-pink-50 text-pink-700 border-pink-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
    black: 'bg-gray-100 text-gray-900 border-gray-300',
    white: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  // 如果是预定义的颜色名称，直接返回
  if (colorMap[colorLowerCase]) {
    return colorMap[colorLowerCase];
  }

  // 如果是hex颜色值，使用灰色作为默认
  if (color.startsWith('#')) {
    return 'bg-gray-50 text-gray-700 border-gray-200';
  }

  // 默认返回灰色
  return colorMap.gray;
};

// 获取标签样式对象（用于内联样式）
export const getTagColorStyle = (color?: string) => {
  if (!color || !color.startsWith('#')) {
    return {};
  }

  // 对于hex颜色，生成对应的浅色背景
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgb = hexToRgb(color);
  if (!rgb) {
    return {};
  }

  return {
    backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`,
    color: color,
    borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`,
  };
};