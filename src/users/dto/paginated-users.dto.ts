import { ApiProperty } from '@nestjs/swagger';
import { PaginatedMetaDto } from '../../common/dto/paginated.dto';
import { UserResponseDto } from './user-response.dto';

/** Страница списка администраторов. */
export class PaginatedUsersDto extends PaginatedMetaDto {
  @ApiProperty({ type: [UserResponseDto], description: 'Администраторы на текущей странице' })
  items!: UserResponseDto[];
}
