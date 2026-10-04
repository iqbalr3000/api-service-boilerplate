import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

@Entity('users')
@Unique('UQ_users_email', ['email'])
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'text' })
    email!: string;

    @Column({ name: 'password_hash', type: 'text' })
    passwordHash!: string;

    @Column({ type: 'text', nullable: true })
    name!: string | null;

    @Column({ type: 'text', array: true, default: '{}' })
    permissions!: string[];

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt!: Date;
}
