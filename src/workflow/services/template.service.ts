import { Injectable } from '@nestjs/common';

@Injectable()
export class TemplateService {
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
    return template.replace(/\{\{(.*?)\}\}/g, (match, path) => {
      const value = path.trim().split('.').reduce((obj, key) => obj?.[key], context);
      return value !== undefined ? value : match;
    });
  }

  extractValue(obj: any, path: string): any {
    return path.replace(/^\$\./, '').split('.').reduce((o, i) => o?.[i], obj);
  }
}