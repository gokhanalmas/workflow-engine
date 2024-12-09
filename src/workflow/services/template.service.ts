import { Injectable, Logger } from '@nestjs/common';
import {format} from "date-fns";

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);


  private formatDate(dateStr: string | null): string | null {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
    } catch (error) {
      this.logger.warn(`Error formatting date: ${dateStr}`);
      return null;
    }
  }

  private createUsername(firstName: string, lastName: string): string {
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Diakritikleri kaldır
        .replace(/[^a-z.]/g, ''); // Özel karakterleri kaldır
  }


  private evaluateCondition(condition: string, context: any): boolean {
    try {
      // condition içindeki template değerlerini çöz
      const resolvedCondition = this.resolveTemplateString(condition, { currentItem: context });
      return !!context[resolvedCondition.replace('currentItem.', '')];
    } catch (error) {
      this.logger.error(`Error evaluating condition: ${condition}`, error);
      return false;
    }
  }


  transformToPassageUser(sourceData: any, step: any): any {
    try {
      // Temel user objesi
      const user = {
        email: sourceData.email,
        password: 'DefaultPass123!',
        password_confirmation: 'DefaultPass123!',
        gsm: sourceData.mobilePhone || '',
        first_name: sourceData.firstName,
        last_name: sourceData.lastName,
        job_position_id: null,
        activation_date: this.formatDate(sourceData.employementStart),
        citizenship_number: '',
        department_id: null,
        about: `${sourceData.position} at ${sourceData.department}`,
        is_active: sourceData.status === 'RUNNING',
        client_id: sourceData.userId,
        gender: '',
        birth_date: sourceData.birthday ? format(new Date(sourceData.birthday), 'yyyy-MM-dd') : null,
        branch_id: null,
        job_departure_date: this.formatDate(sourceData.employementFinish),
        user_type: 'user',
        consumed_timestep: null,
        sub_company_id: null,
        nationality: 'Türkiye',
        marital_status: '',
        spouses_employment_status: '',
        disability_level: '',
        number_of_children: '',
        educational_status: '',
        graduation_level: '',
        graduation_school: '',
        bank_name: '',
        account_type: '',
        account_number: '',
        iban: '',
        emergency_contact_person: '',
        emergency_person_proximity_degree: '',
        emergency_contact_person_1: '',
        emergency_person_proximity_degree_1: '',
        emergency_contact_phone: '',
        other_gsm: null,
        organization_unit_id: null,
        title_id: null,
        user_group_id: null,
        expired_date: null,
        reason_for_leave_id: null,
        shift_id: null,
        faculty_name: '',
        university_department: '',
        employee_type: 'employee',
        supervisor_registration_number: sourceData.managerUserId,
        branch_code: '',
        department_name: sourceData.department,
        department_code: '',
        job_position_name: sourceData.position,
        job_position_code: '',
        title_name: sourceData.position,
        title_code: '',
        sub_company_name: sourceData.company || '',
        sub_company_code: '',
        employee_id: sourceData.userId,
        group_name: sourceData.department,
        group_code: '',
        organization_unit_name: sourceData.workplace || '',
        organization_unit_code: ''
      };

      if (sourceData.mobilePhone) {
        user['gsm'] = sourceData.mobilePhone;
      }

      // Custom transform kurallarını uygula
      if (step.transform) {
        if (step.transform.if && this.evaluateCondition(step.transform.if, sourceData)) {
          Object.assign(user, this.resolveTemplateValues(step.transform.then, { currentItem: sourceData }));
        }
      }

      return { user };
    } catch (error) {
      this.logger.error('Error transforming user data:', error);
      throw error;
    }
  }

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