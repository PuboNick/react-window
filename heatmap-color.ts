/**
 * 热力图颜色计算工具
 * 支持多种颜色渐变方案和插值算法
 */

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface RGBAColor extends RGBColor {
  a: number;
}

export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

export interface ColorStop {
  value: number; // 0-1 之间的值
  color: RGBColor;
}

export interface HeatmapColorConfig {
  /** 颜色渐变方案 */
  gradient: ColorStop[];
  /** 最小值 */
  minValue: number;
  /** 最大值 */
  maxValue: number;
  /** 是否启用透明度 */
  useAlpha?: boolean;
  /** 透明度范围 */
  alphaRange?: [number, number];
}

export class HeatmapColorCalculator {
  private config: HeatmapColorConfig;

  constructor(config: HeatmapColorConfig) {
    this.config = {
      useAlpha: false,
      alphaRange: [0.3, 1.0],
      ...config,
    };
    this.validateConfig();
  }

  /**
   * 验证配置
   */
  private validateConfig(): void {
    let { gradient, minValue, maxValue } = this.config;

    if (gradient.length < 2) {
      throw new Error('渐变颜色至少需要2个颜色停止点');
    }

    if (minValue >= maxValue) {
      minValue -= 1;
      maxValue += 1;
    }

    // 确保渐变点按值排序
    gradient.sort((a, b) => a.value - b.value);

    // 验证值范围
    if (gradient[0].value !== 0 || gradient[gradient.length - 1].value !== 1) {
      throw new Error('渐变点的值必须在0到1之间，且必须包含0和1');
    }
  }

  /**
   * 计算热力图颜色
   * @param value 输入值
   * @returns RGB或RGBA颜色
   */
  getColor(value: number): RGBColor | RGBAColor {
    const { minValue, maxValue, gradient, useAlpha, alphaRange } = this.config;

    // 归一化值到0-1范围
    const normalizedValue = Math.max(0, Math.min(1, (value - minValue) / (maxValue - minValue)));

    // 找到相邻的颜色停止点
    const stopIndex = this.findStopIndex(normalizedValue, gradient);
    const startStop = gradient[stopIndex];
    const endStop = gradient[stopIndex + 1];

    // 计算插值比例
    const ratio = (normalizedValue - startStop.value) / (endStop.value - startStop.value);

    // 线性插值计算RGB颜色
    const rgbColor = this.interpolateRGB(startStop.color, endStop.color, ratio);

    if (useAlpha && alphaRange) {
      // 计算透明度
      const alpha = this.interpolateAlpha(normalizedValue, alphaRange);
      return { ...rgbColor, a: alpha };
    }

    return rgbColor;
  }

  /**
   * 获取十六进制颜色值
   * @param value 输入值
   * @returns 十六进制颜色字符串
   */
  getHexColor(value: number): string {
    const color = this.getColor(value);
    return this.rgbToHex(color);
  }

  /**
   * 获取RGBA颜色字符串
   * @param value 输入值
   * @returns RGBA颜色字符串
   */
  getRGBAString(value: number): string {
    const color = this.getColor(value);
    if ('a' in color) {
      return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
    }
    return `rgb(${color.r}, ${color.g}, ${color.b})`;
  }

  /**
   * 查找颜色停止点索引
   */
  private findStopIndex(value: number, gradient: ColorStop[]): number {
    for (let i = 0; i < gradient.length - 1; i++) {
      if (value >= gradient[i].value && value <= gradient[i + 1].value) {
        return i;
      }
    }
    return gradient.length - 2; // 返回最后一个区间
  }

  /**
   * RGB颜色线性插值
   */
  private interpolateRGB(start: RGBColor, end: RGBColor, ratio: number): RGBColor {
    return {
      r: Math.round(start.r + (end.r - start.r) * ratio),
      g: Math.round(start.g + (end.g - start.g) * ratio),
      b: Math.round(start.b + (end.b - start.b) * ratio),
    };
  }

  /**
   * 透明度插值
   */
  private interpolateAlpha(value: number, alphaRange: [number, number]): number {
    const [minAlpha, maxAlpha] = alphaRange;
    return minAlpha + (maxAlpha - minAlpha) * value;
  }

  /**
   * RGB转十六进制
   */
  private rgbToHex(color: RGBColor): string {
    const { r, g, b } = color;
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  /**
   * 十六进制转RGB
   */
  static hexToRgb(hex: string): RGBColor {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
      throw new Error('Invalid hex color format');
    }
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    };
  }

  /**
   * RGB转HSL
   */
  static rgbToHsl(color: RGBColor): HSLColor {
    const { r, g, b } = color;
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;

    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    let h = 0,
      s = 0,
      l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case rNorm:
          h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
          break;
        case gNorm:
          h = (bNorm - rNorm) / d + 2;
          break;
        case bNorm:
          h = (rNorm - gNorm) / d + 4;
          break;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  /**
   * HSL转RGB
   */
  static hslToRgb(color: HSLColor): RGBColor {
    const { h, s, l } = color;
    const hNorm = h / 360;
    const sNorm = s / 100;
    const lNorm = l / 100;

    if (sNorm === 0) {
      const value = Math.round(lNorm * 255);
      return { r: value, g: value, b: value };
    }

    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
    const p = 2 * lNorm - q;

    return {
      r: Math.round(hue2rgb(p, q, hNorm + 1 / 3) * 255),
      g: Math.round(hue2rgb(p, q, hNorm) * 255),
      b: Math.round(hue2rgb(p, q, hNorm - 1 / 3) * 255),
    };
  }
}

/**
 * 预定义的热力图颜色方案
 */
export const HeatmapColorSchemes = {
  /** 蓝-白-红渐变 */
  BLUE_WHITE_RED: [
    { value: 0, color: { r: 0, g: 0, b: 255 } },
    { value: 0.5, color: { r: 255, g: 255, b: 255 } },
    { value: 1, color: { r: 255, g: 0, b: 0 } },
  ],

  /** 绿-黄-红渐变 */
  GREEN_YELLOW_RED: [
    { value: 0, color: { r: 0, g: 255, b: 0 } },
    { value: 0.5, color: { r: 255, g: 255, b: 0 } },
    { value: 1, color: { r: 255, g: 0, b: 0 } },
  ],

  /** 彩虹渐变 */
  RAINBOW: [
    { value: 0, color: { r: 255, g: 0, b: 0 } },
    { value: 0.2, color: { r: 255, g: 255, b: 0 } },
    { value: 0.4, color: { r: 0, g: 255, b: 0 } },
    { value: 0.6, color: { r: 0, g: 255, b: 255 } },
    { value: 0.8, color: { r: 0, g: 0, b: 255 } },
    { value: 1, color: { r: 255, g: 0, b: 255 } },
  ],

  /** 热度渐变 */
  HEAT: [
    { value: 0, color: { r: 0, g: 0, b: 0 } },
    { value: 0.3, color: { r: 255, g: 0, b: 0 } },
    { value: 0.6, color: { r: 255, g: 255, b: 0 } },
    { value: 1, color: { r: 255, g: 255, b: 255 } },
  ],

  /** 冷色调渐变 */
  COOL: [
    { value: 0, color: { r: 0, g: 0, b: 255 } },
    { value: 0.5, color: { r: 0, g: 255, b: 255 } },
    { value: 1, color: { r: 255, g: 255, b: 255 } },
  ],
};

/**
 * 创建标准热力图颜色计算器
 */
export function createHeatmapCalculator(
  minValue: number,
  maxValue: number,
  scheme: keyof typeof HeatmapColorSchemes = 'HEAT',
  useAlpha: boolean = false,
): HeatmapColorCalculator {
  return new HeatmapColorCalculator({
    minValue,
    maxValue,
    gradient: HeatmapColorSchemes[scheme],
    useAlpha,
  });
}

/**
 * 快速获取热力图颜色（简化版）
 */
export function getHeatmapColor(
  value: number,
  minValue: number,
  maxValue: number,
  scheme: keyof typeof HeatmapColorSchemes = 'HEAT',
): string {
  const calculator = createHeatmapCalculator(minValue, maxValue, scheme);
  return calculator.getHexColor(value);
}
