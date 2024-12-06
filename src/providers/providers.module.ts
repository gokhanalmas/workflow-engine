import { Module } from '@nestjs/common';
import { DerimodService } from './derimod/derimod.service';
import { PassageService } from './passage/passage.service';

@Module({
  providers: [DerimodService, PassageService],
  exports: [DerimodService, PassageService],
})
export class ProvidersModule {}