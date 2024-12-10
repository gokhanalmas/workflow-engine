import { Injectable, Logger } from '@nestjs/common';
import { IPassageUser, ICreatePassageUserRequest } from '../interfaces/passage.interface';
import { format } from 'date-fns';

@Injectable()
export class UserTransformService {
    private readonly logger = new Logger(UserTransformService.name);

    transformToPassageUser(sourceData: any, transformRules?: Record<string, any>): ICreatePassageUserRequest {
        if (!sourceData) {
            throw new Error('Source data is required for user transformation');
        }

        // Validate required fields
        const requiredFields = ['email', 'firstName', 'lastName'];
        const missingFields = requiredFields.filter(field => !sourceData[field]);

        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        try {
            const baseFields = this.getBaseUserFields(sourceData);
            const requiredFields = this.getRequiredPassageFields(sourceData);
            const customFields = this.applyTransformRules(sourceData, transformRules);

            const userFields: IPassageUser = {
                ...baseFields,
                ...requiredFields,
                ...customFields
            };

            this.logger.debug('Transformed user fields:', {
                email: userFields.email,
                firstName: userFields.first_name,
                lastName: userFields.last_name
            });

            return { user: userFields };
        } catch (error) {
            this.logger.error('Error transforming user data:', {
                error: error.message,
                sourceData: {
                    hasEmail: !!sourceData.email,
                    hasFirstName: !!sourceData.firstName,
                    hasLastName: !!sourceData.lastName
                }
            });
            throw error;
        }
    }

    private getBaseUserFields(sourceData: any) {
        return {
            email: sourceData.email,
            password: 'DefaultPass123!',
            password_confirmation: 'DefaultPass123!',
            first_name: sourceData.firstName,
            last_name: sourceData.lastName,
            about: `${sourceData.position} at ${sourceData.department}`,
            is_active: sourceData.status === 'RUNNING',
            client_id: sourceData.userId,
            employee_id: sourceData.userId
        };
    }

    private getRequiredPassageFields(sourceData: any) {
        return {
            gsm: sourceData.mobilePhone || '',
            job_position_id: null,
            activation_date: this.formatDate(sourceData.employementStart),
            citizenship_number: '',
            department_id: null,
            username: sourceData.username || null,
            gender: '',
            birth_date: sourceData.birthday ? format(new Date(sourceData.birthday), 'yyyy-MM-dd') : '',
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
            group_name: sourceData.department,
            group_code: '',
            organization_unit_name: sourceData.workplace || '',
            organization_unit_code: ''
        };
    }

    private applyTransformRules(sourceData: any, rules?: Record<string, any>): Partial<IPassageUser> {
        if (!rules) return {};

        try {
            const transformedFields: Partial<IPassageUser> = {};

            // Apply direct field mappings
            if (rules.fieldMappings) {
                Object.entries(rules.fieldMappings).forEach(([target, source]) => {
                    transformedFields[target] = this.getNestedValue(sourceData, source as string);
                });
            }

            // Apply conditional transformations
            if (rules.conditions) {
                rules.conditions.forEach(condition => {
                    if (this.evaluateCondition(condition.if, sourceData)) {
                        Object.assign(transformedFields, condition.then);
                    }
                });
            }

            // Apply custom transformations
            if (rules.customTransforms) {
                rules.customTransforms.forEach(transform => {
                    const result = transform(sourceData);
                    Object.assign(transformedFields, result);
                });
            }

            return transformedFields;
        } catch (error) {
            this.logger.error(`Error applying transform rules: ${error.message}`);
            return {};
        }
    }

    private formatDate(dateStr: string | null): string {
        if (!dateStr) return '';
        try {
            return format(new Date(dateStr), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
        } catch (error) {
            this.logger.warn(`Error formatting date: ${dateStr}`);
            return '';
        }
    }

    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((curr, key) => curr?.[key], obj);
    }

    private evaluateCondition(condition: string | ((data: any) => boolean), data: any): boolean {
        try {
            if (typeof condition === 'function') {
                return condition(data);
            }
            return !!this.getNestedValue(data, condition);
        } catch (error) {
            this.logger.error(`Error evaluating condition: ${error.message}`);
            return false;
        }
    }
}