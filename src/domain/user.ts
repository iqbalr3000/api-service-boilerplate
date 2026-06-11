import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index({ unique: true })
    @Column({ type: 'text' })
    email!: string;

    @Column({ name: 'password_hash', type: 'text' })
    passwordHash!: string;

    @Column({ type: 'text', nullable: true })
    name!: string | null;

    // Stored as a comma-separated text column (TypeORM `simple-array`).
    @Column({ type: 'simple-array', default: '' })
    permissions!: string[];

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt!: Date;
}
