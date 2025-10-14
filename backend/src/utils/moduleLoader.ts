/**
 * 模块动态加载器
 * 优化模块结构，减少循环依赖
 */

import { Router } from 'express';
import path from 'path';
import fs from 'fs';

export class ModuleLoader {
  private static loadedModules = new Map<string, any>();
  private static loadingModules = new Set<string>();

  /**
   * 动态加载路由模块
   */
  static async loadRoutes(routesDir: string): Promise<Map<string, Router>> {
    const routes = new Map<string, Router>();
    const routeFiles = fs.readdirSync(routesDir)
      .filter(file => file.endsWith('.ts') || file.endsWith('.js'));

    for (const file of routeFiles) {
      const routeName = path.basename(file, path.extname(file));
      const routePath = path.join(routesDir, file);
      
      try {
        const module = await this.loadModule(routePath);
        if (module && module.default) {
          routes.set(routeName, module.default);
          console.log(`✅ Loaded route: ${routeName}`);
        }
      } catch (error) {
        console.error(`❌ Failed to load route ${routeName}:`, error);
      }
    }

    return routes;
  }

  /**
   * 安全的模块加载，防止循环依赖
   */
  static async loadModule(modulePath: string): Promise<any> {
    // 检查是否已加载
    if (this.loadedModules.has(modulePath)) {
      return this.loadedModules.get(modulePath);
    }

    // 检查是否正在加载（循环依赖检测）
    if (this.loadingModules.has(modulePath)) {
      console.warn(`⚠️ Circular dependency detected: ${modulePath}`);
      return null;
    }

    try {
      this.loadingModules.add(modulePath);
      const module = await import(modulePath);
      this.loadedModules.set(modulePath, module);
      return module;
    } catch (error) {
      console.error(`Failed to load module ${modulePath}:`, error);
      throw error;
    } finally {
      this.loadingModules.delete(modulePath);
    }
  }

  /**
   * 清理缓存的模块（用于开发环境热重载）
   */
  static clearCache(modulePath?: string) {
    if (modulePath) {
      this.loadedModules.delete(modulePath);
      delete require.cache[require.resolve(modulePath)];
    } else {
      this.loadedModules.clear();
      Object.keys(require.cache).forEach(key => {
        delete require.cache[key];
      });
    }
  }

  /**
   * 获取模块依赖关系图
   */
  static getDependencyGraph(): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    for (const [modulePath, module] of this.loadedModules) {
      const deps: string[] = [];
      
      // 分析模块的require/import语句
      // 这里简化处理，实际可以使用AST分析
      if (module && typeof module === 'object') {
        Object.keys(module).forEach(key => {
          if (typeof module[key] === 'function') {
            const funcStr = module[key].toString();
            const requireMatches = funcStr.match(/require\(['"]([^'"]+)['"]\)/g);
            const importMatches = funcStr.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/g);
            
            if (requireMatches) {
              requireMatches.forEach(match => {
                const dep = match.match(/['"]([^'"]+)['"]/)?.[1];
                if (dep && !deps.includes(dep)) {
                  deps.push(dep);
                }
              });
            }
            
            if (importMatches) {
              importMatches.forEach(match => {
                const dep = match.match(/['"]([^'"]+)['"]/)?.[1];
                if (dep && !deps.includes(dep)) {
                  deps.push(dep);
                }
              });
            }
          }
        });
      }
      
      graph.set(modulePath, deps);
    }
    
    return graph;
  }

  /**
   * 检测循环依赖
   */
  static detectCircularDependencies(): string[] {
    const graph = this.getDependencyGraph();
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[] = [];

    function dfs(node: string, path: string[] = []): boolean {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const dependencies = graph.get(node) || [];
      for (const dep of dependencies) {
        if (!visited.has(dep)) {
          if (dfs(dep, [...path])) {
            return true;
          }
        } else if (recursionStack.has(dep)) {
          // 发现循环依赖
          const cycleStart = path.indexOf(dep);
          const cycle = path.slice(cycleStart).concat(dep);
          cycles.push(cycle.join(' -> '));
          return true;
        }
      }

      recursionStack.delete(node);
      return false;
    }

    for (const [module] of graph) {
      if (!visited.has(module)) {
        dfs(module);
      }
    }

    return cycles;
  }
}

/**
 * 依赖注入容器
 */
export class DIContainer {
  private static services = new Map<string, any>();
  private static factories = new Map<string, () => any>();

  /**
   * 注册服务
   */
  static register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  /**
   * 注册工厂函数
   */
  static registerFactory<T>(name: string, factory: () => T): void {
    this.factories.set(name, factory);
  }

  /**
   * 获取服务
   */
  static get<T>(name: string): T {
    if (this.services.has(name)) {
      return this.services.get(name);
    }

    if (this.factories.has(name)) {
      const factory = this.factories.get(name);
      const service = factory();
      this.services.set(name, service);
      return service;
    }

    throw new Error(`Service ${name} not found`);
  }

  /**
   * 检查服务是否存在
   */
  static has(name: string): boolean {
    return this.services.has(name) || this.factories.has(name);
  }

  /**
   * 清理容器
   */
  static clear(): void {
    this.services.clear();
    this.factories.clear();
  }
}
