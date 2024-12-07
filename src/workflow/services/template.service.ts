import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  resolveTemplateValues(obj: any, context: any): any {
    if (typeof obj === 'string') {
      return this.resolveTemplateString(obj, context);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.resolveTemplateValues(item, context));
    }

    if (typeof obj === 'object' && obj !== null) {
      const resolved = {};
      for (const [key, value] of Object.entries(obj)) {
        resolved[key] = this.resolveTemplateValues(value, context);
      }
      return resolved;
    }

    return obj;
  }

  resolveTemplateString(template: string, context: any): string {
    if (typeof template !== 'string') return template;

    return template.replace(/\{\{(.*?)\}\}/g, (match, path) => {
      const value = path.trim().split('.').reduce((obj, key) => obj?.[key], context);
      if (value === undefined) {
        this.logger.warn(`Template value not found for path: ${path} in context:`, context);
        return match;
      }
      return value;
    });
  }

  extractValue(obj: any, path: string): any {
    if (!path.startsWith('$.')) {
      return path;
    }
    const cleanPath = path.replace(/^\$\./, '');
    const value = cleanPath.split('.').reduce((o, i) => o?.[i], obj);

    if (value === undefined) {
      this.logger.warn(`Value not found for path: ${path} in object:`, obj);
    }

    return value;
  }
}