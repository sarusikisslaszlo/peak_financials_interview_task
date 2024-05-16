import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Stock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  symbol: string;

  @Column('float')
  price: number;

  @CreateDateColumn()
  timestamp: Date;
}
