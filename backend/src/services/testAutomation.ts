/**
 * 测试自动化服务
 * 提供单元测试、集成测试、E2E测试的自动化执行和报告
 */

import { logger } from '../utils/monitoring';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

interface TestSuite {
  id: string;
  name: string;
  type: 'unit' | 'integration' | 'e2e' | 'performance';
  files: string[];
  config?: any;
}

interface TestResult {
  suiteId: string;
  timestamp: Date;
  duration: number;
  passed: number;
  failed: number;
  skipped: number;
  coverage?: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  failures?: Array<{
    test: string;
    error: string;
    stack?: string;
  }>;
}

interface TestReport {
  id: string;
  timestamp: Date;
  environment: string;
  results: TestResult[];
  summary: {
    totalTests: number;
    totalPassed: number;
    totalFailed: number;
    totalSkipped: number;
    averageCoverage?: number;
    duration: number;
  };
}

export class TestAutomationService {
  private static testSuites: Map<string, TestSuite> = new Map();
  private static testHistory: TestReport[] = [];

  /**
   * 初始化测试服务
   */
  static async initialize() {
    // 配置测试套件
    this.configureTestSuites();

    // 加载测试历史
    await this.loadTestHistory();

    logger.info('Test automation service initialized');
  }

  /**
   * 运行所有测试
   */
  static async runAllTests(
    options: {
      environment?: string;
      parallel?: boolean;
      coverage?: boolean;
    } = {}
  ): Promise<TestReport> {
    const report: TestReport = {
      id: `test-${Date.now()}`,
      timestamp: new Date(),
      environment: options.environment || 'test',
      results: [],
      summary: {
        totalTests: 0,
        totalPassed: 0,
        totalFailed: 0,
        totalSkipped: 0,
        duration: 0
      }
    };

    const startTime = Date.now();

    try {
      // 准备测试环境
      await this.prepareTestEnvironment(options.environment);

      // 运行各类测试
      const suites = Array.from(this.testSuites.values());
      
      if (options.parallel) {
        // 并行运行测试
        const results = await Promise.all(
          suites.map(suite => this.runTestSuite(suite, options))
        );
        report.results = results;
      } else {
        // 串行运行测试
        for (const suite of suites) {
          const result = await this.runTestSuite(suite, options);
          report.results.push(result);
        }
      }

      // 计算汇总数据
      report.summary = this.calculateSummary(report.results);
      report.summary.duration = Date.now() - startTime;

      // 保存测试报告
      await this.saveTestReport(report);

      // 生成覆盖率报告
      if (options.coverage) {
        await this.generateCoverageReport(report);
      }

      logger.info('All tests completed', report.summary);

      return report;
    } catch (error) {
      logger.error('Test execution failed', error);
      throw error;
    }
  }

  /**
   * 运行特定测试套件
   */
  static async runTestSuite(
    suite: TestSuite,
    options: any = {}
  ): Promise<TestResult> {
    logger.info(`Running test suite: ${suite.name}`);

    const result: TestResult = {
      suiteId: suite.id,
      timestamp: new Date(),
      duration: 0,
      passed: 0,
      failed: 0,
      skipped: 0
    };

    const startTime = Date.now();

    try {
      // 根据测试类型运行不同的命令
      let command: string;
      
      switch (suite.type) {
        case 'unit':
          command = `npm run test:unit ${suite.files.join(' ')}`;
          break;
        case 'integration':
          command = `npm run test:integration ${suite.files.join(' ')}`;
          break;
        case 'e2e':
          command = `npm run test:e2e ${suite.files.join(' ')}`;
          break;
        case 'performance':
          command = `npm run test:performance ${suite.files.join(' ')}`;
          break;
        default:
          throw new Error(`Unknown test type: ${suite.type}`);
      }

      if (options.coverage) {
        command = `${command} -- --coverage`;
      }

      // 执行测试
      const { stdout, stderr } = await execAsync(command, {
        env: {
          ...process.env,
          NODE_ENV: 'test',
          TEST_ENV: options.environment || 'test'
        }
      });

      // 解析测试结果
      const parsed = this.parseTestOutput(stdout, suite.type);
      Object.assign(result, parsed);

      result.duration = Date.now() - startTime;

      logger.info(`Test suite completed: ${suite.name}`, {
        passed: result.passed,
        failed: result.failed,
        duration: result.duration
      });

      return result;
    } catch (error: any) {
      result.failed = 1;
      result.duration = Date.now() - startTime;
      result.failures = [{
        test: suite.name,
        error: error.message,
        stack: error.stack
      }];

      logger.error(`Test suite failed: ${suite.name}`, error);
      
      return result;
    }
  }

  /**
   * 生成测试报告
   */
  static async generateTestReport(
    format: 'html' | 'json' | 'junit' = 'html'
  ): Promise<string> {
    const latestReport = this.testHistory[this.testHistory.length - 1];
    if (!latestReport) {
      throw new Error('No test reports available');
    }

    const reportDir = path.join(process.cwd(), 'test-reports');
    await fs.mkdir(reportDir, { recursive: true });

    let reportPath: string;

    switch (format) {
      case 'html':
        reportPath = await this.generateHTMLReport(latestReport, reportDir);
        break;
      case 'json':
        reportPath = path.join(reportDir, `report-${latestReport.id}.json`);
        await fs.writeFile(reportPath, JSON.stringify(latestReport, null, 2));
        break;
      case 'junit':
        reportPath = await this.generateJUnitReport(latestReport, reportDir);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    logger.info(`Test report generated: ${reportPath}`);
    return reportPath;
  }

  /**
   * 获取测试趋势
   */
  static async getTestTrends(days: number = 30): Promise<{
    dates: string[];
    passed: number[];
    failed: number[];
    coverage: number[];
    duration: number[];
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const relevantReports = this.testHistory.filter(
      report => report.timestamp > cutoffDate
    );

    return {
      dates: relevantReports.map(r => r.timestamp.toISOString().split('T')[0]),
      passed: relevantReports.map(r => r.summary.totalPassed),
      failed: relevantReports.map(r => r.summary.totalFailed),
      coverage: relevantReports.map(r => r.summary.averageCoverage || 0),
      duration: relevantReports.map(r => r.summary.duration / 1000) // 秒
    };
  }

  /**
   * 运行冒烟测试
   */
  static async runSmokeTests(): Promise<boolean> {
    logger.info('Running smoke tests');

    const criticalTests = [
      'test/smoke/auth.test.ts',
      'test/smoke/api.test.ts',
      'test/smoke/database.test.ts',
      'test/smoke/frontend.test.ts'
    ];

    try {
      for (const test of criticalTests) {
        const { stdout } = await execAsync(`npm test ${test}`);
        if (stdout.includes('FAIL')) {
          logger.error(`Smoke test failed: ${test}`);
          return false;
        }
      }

      logger.info('All smoke tests passed');
      return true;
    } catch (error) {
      logger.error('Smoke tests failed', error);
      return false;
    }
  }

  // 私有辅助方法

  private static configureTestSuites() {
    // 单元测试
    this.testSuites.set('unit-backend', {
      id: 'unit-backend',
      name: '后端单元测试',
      type: 'unit',
      files: ['backend/src/**/*.test.ts']
    });

    this.testSuites.set('unit-frontend', {
      id: 'unit-frontend',
      name: '前端单元测试',
      type: 'unit',
      files: ['frontend/src/**/*.test.tsx']
    });

    // 集成测试
    this.testSuites.set('integration-api', {
      id: 'integration-api',
      name: 'API集成测试',
      type: 'integration',
      files: ['test/integration/api/**/*.test.ts']
    });

    // E2E测试
    this.testSuites.set('e2e-critical', {
      id: 'e2e-critical',
      name: '关键流程E2E测试',
      type: 'e2e',
      files: ['test/e2e/critical/**/*.test.ts']
    });

    // 性能测试
    this.testSuites.set('performance', {
      id: 'performance',
      name: '性能测试',
      type: 'performance',
      files: ['test/performance/**/*.test.ts']
    });
  }

  private static async loadTestHistory() {
    try {
      const historyFile = path.join(process.cwd(), 'test-history.json');
      const data = await fs.readFile(historyFile, 'utf-8');
      this.testHistory = JSON.parse(data).map((report: any) => ({
        ...report,
        timestamp: new Date(report.timestamp)
      }));
    } catch (error) {
      this.testHistory = [];
    }
  }

  private static async prepareTestEnvironment(environment?: string) {
    // 设置测试数据库
    if (environment === 'test') {
      await execAsync('npm run db:test:reset');
    }

    // 清理缓存
    await execAsync('npm run cache:clear');

    // 确保测试目录存在
    await fs.mkdir('test-reports', { recursive: true });
    await fs.mkdir('coverage', { recursive: true });
  }

  private static parseTestOutput(output: string, type: string): Partial<TestResult> {
    const result: Partial<TestResult> = {
      passed: 0,
      failed: 0,
      skipped: 0
    };

    // 解析 Jest 输出
    const passMatch = output.match(/(\d+) passed/);
    const failMatch = output.match(/(\d+) failed/);
    const skipMatch = output.match(/(\d+) skipped/);

    if (passMatch) result.passed = parseInt(passMatch[1]);
    if (failMatch) result.failed = parseInt(failMatch[1]);
    if (skipMatch) result.skipped = parseInt(skipMatch[1]);

    // 解析覆盖率
    const coverageMatch = output.match(/Statements\s+:\s+([\d.]+)%.*Branches\s+:\s+([\d.]+)%.*Functions\s+:\s+([\d.]+)%.*Lines\s+:\s+([\d.]+)%/s);
    if (coverageMatch) {
      result.coverage = {
        statements: parseFloat(coverageMatch[1]),
        branches: parseFloat(coverageMatch[2]),
        functions: parseFloat(coverageMatch[3]),
        lines: parseFloat(coverageMatch[4])
      };
    }

    return result;
  }

  private static calculateSummary(results: TestResult[]): TestReport['summary'] {
    const summary = {
      totalTests: 0,
      totalPassed: 0,
      totalFailed: 0,
      totalSkipped: 0,
      averageCoverage: 0,
      duration: 0
    };

    let coverageCount = 0;
    let totalCoverage = 0;

    for (const result of results) {
      summary.totalPassed += result.passed;
      summary.totalFailed += result.failed;
      summary.totalSkipped += result.skipped;
      summary.duration += result.duration;

      if (result.coverage) {
        totalCoverage += (
          result.coverage.statements +
          result.coverage.branches +
          result.coverage.functions +
          result.coverage.lines
        ) / 4;
        coverageCount++;
      }
    }

    summary.totalTests = summary.totalPassed + summary.totalFailed + summary.totalSkipped;
    
    if (coverageCount > 0) {
      summary.averageCoverage = totalCoverage / coverageCount;
    }

    return summary;
  }

  private static async saveTestReport(report: TestReport) {
    this.testHistory.push(report);

    // 保留最近100次测试记录
    if (this.testHistory.length > 100) {
      this.testHistory = this.testHistory.slice(-100);
    }

    const historyFile = path.join(process.cwd(), 'test-history.json');
    await fs.writeFile(historyFile, JSON.stringify(this.testHistory, null, 2));
  }

  private static async generateCoverageReport(report: TestReport) {
    // 生成覆盖率报告
    try {
      await execAsync('npm run coverage:report');
      logger.info('Coverage report generated');
    } catch (error) {
      logger.error('Failed to generate coverage report', error);
    }
  }

  private static async generateHTMLReport(
    report: TestReport,
    reportDir: string
  ): Promise<string> {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Report - ${report.id}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f0f0f0; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .suite { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 4px; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .chart { margin: 20px 0; }
    </style>
</head>
<body>
    <h1>Test Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p>Date: ${report.timestamp.toLocaleString()}</p>
        <p>Environment: ${report.environment}</p>
        <p>Total Tests: ${report.summary.totalTests}</p>
        <p class="passed">Passed: ${report.summary.totalPassed}</p>
        <p class="failed">Failed: ${report.summary.totalFailed}</p>
        <p class="skipped">Skipped: ${report.summary.totalSkipped}</p>
        <p>Average Coverage: ${report.summary.averageCoverage?.toFixed(2) || 'N/A'}%</p>
        <p>Duration: ${(report.summary.duration / 1000).toFixed(2)}s</p>
    </div>
    
    <h2>Test Suites</h2>
    ${report.results.map(result => `
        <div class="suite">
            <h3>${this.testSuites.get(result.suiteId)?.name || result.suiteId}</h3>
            <p class="passed">Passed: ${result.passed}</p>
            <p class="failed">Failed: ${result.failed}</p>
            <p class="skipped">Skipped: ${result.skipped}</p>
            <p>Duration: ${(result.duration / 1000).toFixed(2)}s</p>
            ${result.coverage ? `
                <p>Coverage: 
                    Statements: ${result.coverage.statements}% | 
                    Branches: ${result.coverage.branches}% | 
                    Functions: ${result.coverage.functions}% | 
                    Lines: ${result.coverage.lines}%
                </p>
            ` : ''}
            ${result.failures ? `
                <h4>Failures:</h4>
                <ul>
                    ${result.failures.map(f => `
                        <li>
                            <strong>${f.test}</strong>: ${f.error}
                            ${f.stack ? `<pre>${f.stack}</pre>` : ''}
                        </li>
                    `).join('')}
                </ul>
            ` : ''}
        </div>
    `).join('')}
</body>
</html>
    `;

    const reportPath = path.join(reportDir, `report-${report.id}.html`);
    await fs.writeFile(reportPath, html);

    return reportPath;
  }

  private static async generateJUnitReport(
    report: TestReport,
    reportDir: string
  ): Promise<string> {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="WebSpark Tests" tests="${report.summary.totalTests}" failures="${report.summary.totalFailed}" time="${report.summary.duration / 1000}">
${report.results.map(result => `
    <testsuite name="${this.testSuites.get(result.suiteId)?.name || result.suiteId}" tests="${result.passed + result.failed + result.skipped}" failures="${result.failed}" skipped="${result.skipped}" time="${result.duration / 1000}">
        ${result.failures ? result.failures.map(f => `
        <testcase name="${f.test}" time="0">
            <failure message="${f.error}">${f.stack || f.error}</failure>
        </testcase>
        `).join('') : ''}
    </testsuite>
`).join('')}
</testsuites>`;

    const reportPath = path.join(reportDir, `report-${report.id}.xml`);
    await fs.writeFile(reportPath, xml);

    return reportPath;
  }
}
