import { IsUrl, IsNumber, Min } from 'class-validator';

export class CreateTrackerDto {
  @IsUrl({}, { message: 'Must be a valid URL' })
  url!: string;

  @IsNumber()
  @Min(0.01)
  targetPrice!: number;
}
