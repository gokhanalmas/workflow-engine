import { Module } from '@nestjs/common';
import { PassageService } from './passage/passage.service';

@Module({
  providers: [PassageService],
  exports: [PassageService],
})
export class ProvidersModule {}