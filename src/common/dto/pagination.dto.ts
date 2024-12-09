import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
    @ApiProperty({ required: false, default: 1 })
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @IsOptional()
    page?: number = 1;

    @ApiProperty({ required: false, default: 10 })
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @IsOptional()
    limit?: number = 10;
}

export class PageMetaDto {
    @ApiProperty()
    page: number;

    @ApiProperty()
    limit: number;

    @ApiProperty()
    itemCount: number;

    @ApiProperty()
    pageCount: number;

    @ApiProperty()
    hasPreviousPage: boolean;

    @ApiProperty()
    hasNextPage: boolean;

    constructor(page: number, limit: number, itemCount: number) {
        this.page = page;
        this.limit = limit;
        this.itemCount = itemCount;
        this.pageCount = Math.ceil(itemCount / limit);
        this.hasPreviousPage = page > 1;
        this.hasNextPage = page < this.pageCount;
    }
}

export class PageDto<T> {
    @ApiProperty({ isArray: true })
    data: T[];

    @ApiProperty()
    meta: PageMetaDto;

    constructor(data: T[], meta: PageMetaDto) {
        this.data = data;
        this.meta = meta;
    }
}
