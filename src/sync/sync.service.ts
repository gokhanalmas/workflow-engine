import { Injectable, Logger } from '@nestjs/common';
import { TenantsService } from '../tenants/tenants.service';
import { DerimodService } from '../providers/derimod/derimod.service';
import { PassageService } from '../providers/passage/passage.service';
import { CreatePassageUserDto } from '../providers/passage/dto/create-passage-user.dto';
import * as moment from 'moment';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly tenantsService: TenantsService,
    private readonly derimodService: DerimodService,
    private readonly passageService: PassageService,
  ) {}

  async syncTenantUsers(tenantId: string, passageToken: string) {
    try {
      // Get provider config for the tenant
      const providerConfig = await this.tenantsService.getProviderConfig(tenantId, 'derimod');
      
      // Initialize provider with tenant-specific config
      this.derimodService.initialize({
        apiUrl: providerConfig.apiUrl,
        username: providerConfig.username,
        password: providerConfig.password,
        additionalConfig: providerConfig.additionalConfig,
      });

      // Get users from provider
      const users = await this.derimodService.getUsers();
      
      // Sync each user to Passage
      for (const user of users) {
        await this.syncUserToPassage(user, passageToken);
      }
      
      this.logger.log(`Successfully synced ${users.length} users to Passage for tenant ${tenantId}`);
    } catch (error) {
      this.logger.error(`Error syncing users for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  private async syncUserToPassage(worker: any, passageToken: string) {
    const passageUser: CreatePassageUserDto = {
      user: {
        email: worker.email,
        password: 'DefaultPass123!',
        password_confirmation: 'DefaultPass123!',
        gsm: worker.mobilePhone || '',
        first_name: worker.firstName,
        last_name: worker.lastName,
        job_position_id: null,
        activation_date: moment(worker.employementStart).format(),
        citizenship_number: '',
        department_id: null,
        username: `${worker.firstName.toLowerCase()}.${worker.lastName.toLowerCase()}`,
        about: `${worker.position} at ${worker.department}`,
        is_active: worker.status === 'RUNNING',
        client_id: worker.userId,
        gender: '',
        birth_date: moment(worker.birthday).format('YYYY-MM-DD'),
        branch_id: null,
        job_departure_date: worker.employementFinish ? moment(worker.employementFinish).format() : null,
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
        supervisor_registration_number: worker.managerUserId,
        branch_code: '',
        department_name: worker.department,
        department_code: '',
        job_position_name: worker.position,
        job_position_code: '',
        title_name: worker.position,
        title_code: '',
        sub_company_name: worker.company,
        sub_company_code: '',
        employee_id: worker.userId,
        group_name: worker.department,
        group_code: '',
        organization_unit_name: worker.workplace,
        organization_unit_code: '',
      },
    };

    try {
      await this.passageService.createUser(passageUser, passageToken);
      this.logger.log(`Successfully synced user: ${worker.email}`);
    } catch (error) {
      this.logger.error(`Error syncing user ${worker.email}:`, error);
      throw error;
    }
  }
}