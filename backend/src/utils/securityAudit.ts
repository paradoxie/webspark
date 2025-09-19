import { Request } from 'express';
import fs from 'fs/promises';
import path from 'path';

export interface SecurityEvent {
  timestamp: Date;
  type: 'AUTH_FAILURE' | 'INVALID_INPUT' | 'CSRF_ATTACK' | 'XSS_ATTEMPT' | 'SQL_INJECTION' | 'FILE_UPLOAD_ERROR' | 'SUSPICIOUS_ACTIVITY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ip: string;
  userAgent: string;
  userId?: number;
  endpoint: string;
  method: string;
  details: any;
  location?: {
    country?: string;
    city?: string;
  };
}

export class SecurityAuditLogger {
  private static logDir = path.join(process.cwd(), 'logs', 'security');
  private static maxLogFileSize = 10 * 1024 * 1024; // 10MB
  private static maxLogFiles = 30; // 保留30个日志文件

  static async init() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create security log directory:', error);
    }
  }

  static async logSecurityEvent(event: SecurityEvent) {
    try {
      // 准备日志条目
      const logEntry = {
        ...event,
        timestamp: event.timestamp.toISOString(),
        id: this.generateEventId()
      };

      // 写入文件
      await this.writeToFile(logEntry);

      // 根据严重程度决定是否实时告警
      if (event.severity === 'CRITICAL' || event.severity === 'HIGH') {
        await this.sendAlert(logEntry);
      }

      // 检查是否需要轮转日志文件
      await this.rotateLogsIfNeeded();

    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  static async logFromRequest(
    req: Request, 
    type: SecurityEvent['type'], 
    severity: SecurityEvent['severity'],
    details: any,
    userId?: number
  ) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    const event: SecurityEvent = {
      timestamp: new Date(),
      type,
      severity,
      ip,
      userAgent,
      userId,
      endpoint: req.path,
      method: req.method,
      details
    };

    await this.logSecurityEvent(event);
  }

  private static generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private static async writeToFile(logEntry: any) {
    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(this.logDir, `security-${today}.log`);

    const logLine = JSON.stringify(logEntry) + '\n';
    
    try {
      await fs.appendFile(logFile, logLine, 'utf8');
    } catch (error) {
      console.error('Failed to write to security log file:', error);
    }
  }

  private static async sendAlert(logEntry: any) {
    // 这里可以集成邮件、Slack、钉钉等告警通知
    console.error('🚨 SECURITY ALERT:', {
      type: logEntry.type,
      severity: logEntry.severity,
      ip: logEntry.ip,
      endpoint: logEntry.endpoint,
      details: logEntry.details
    });

    // 如果配置了邮件服务，可以发送告警邮件
    if (process.env.SECURITY_ALERT_EMAIL) {
      try {
        // TODO: 实现邮件告警
        console.log('Security alert email would be sent to:', process.env.SECURITY_ALERT_EMAIL);
      } catch (error) {
        console.error('Failed to send security alert email:', error);
      }
    }
  }

  private static async rotateLogsIfNeeded() {
    try {
      const files = await fs.readdir(this.logDir);
      const logFiles = files.filter(file => file.startsWith('security-') && file.endsWith('.log'));

      // 检查文件大小
      for (const file of logFiles) {
        const filePath = path.join(this.logDir, file);
        const stats = await fs.stat(filePath);

        if (stats.size > this.maxLogFileSize) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const archiveName = file.replace('.log', `-${timestamp}.log`);
          const archivePath = path.join(this.logDir, 'archive', archiveName);

          await fs.mkdir(path.dirname(archivePath), { recursive: true });
          await fs.rename(filePath, archivePath);
        }
      }

      // 清理旧文件
      await this.cleanupOldLogs();
    } catch (error) {
      console.error('Failed to rotate security logs:', error);
    }
  }

  private static async cleanupOldLogs() {
    try {
      const archiveDir = path.join(this.logDir, 'archive');
      const files = await fs.readdir(archiveDir).catch(() => []);
      
      if (files.length > this.maxLogFiles) {
        // 按修改时间排序，删除最旧的文件
        const fileStats = await Promise.all(
          files.map(async file => ({
            name: file,
            mtime: (await fs.stat(path.join(archiveDir, file))).mtime
          }))
        );

        fileStats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());
        const filesToDelete = fileStats.slice(0, fileStats.length - this.maxLogFiles);

        for (const file of filesToDelete) {
          await fs.unlink(path.join(archiveDir, file.name));
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old security logs:', error);
    }
  }

  static async getSecurityEvents(
    startDate?: Date, 
    endDate?: Date, 
    type?: SecurityEvent['type'],
    severity?: SecurityEvent['severity']
  ): Promise<SecurityEvent[]> {
    try {
      const events: SecurityEvent[] = [];
      const files = await fs.readdir(this.logDir);
      const logFiles = files.filter(file => file.startsWith('security-') && file.endsWith('.log'));

      for (const file of logFiles) {
        const filePath = path.join(this.logDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.trim().split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const event = JSON.parse(line);
            const eventDate = new Date(event.timestamp);

            // 过滤条件
            if (startDate && eventDate < startDate) continue;
            if (endDate && eventDate > endDate) continue;
            if (type && event.type !== type) continue;
            if (severity && event.severity !== severity) continue;

            events.push({
              ...event,
              timestamp: eventDate
            });
          } catch (parseError) {
            console.error('Failed to parse security log line:', parseError);
          }
        }
      }

      return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Failed to get security events:', error);
      return [];
    }
  }

  static async getSecurityStats(days: number = 7): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    topIPs: Array<{ ip: string; count: number }>;
    recentEvents: SecurityEvent[];
  }> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    
    const events = await this.getSecurityEvents(startDate, endDate);
    
    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    const ipCounts: Record<string, number> = {};

    events.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      ipCounts[event.ip] = (ipCounts[event.ip] || 0) + 1;
    });

    const topIPs = Object.entries(ipCounts)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEvents: events.length,
      eventsByType,
      eventsBySeverity,
      topIPs,
      recentEvents: events.slice(0, 20)
    };
  }
}