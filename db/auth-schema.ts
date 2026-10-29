import { sqliteTable,text,integer } from 'drizzle-orm/sqlite-core';
export const authUser=sqliteTable('auth_user',{
 id:text('id').primaryKey(),name:text('name').notNull(),email:text('email').notNull().unique(),emailVerified:integer('email_verified',{mode:'boolean'}).notNull().default(false),image:text('image'),createdAt:integer('created_at',{mode:'timestamp_ms'}).notNull(),updatedAt:integer('updated_at',{mode:'timestamp_ms'}).notNull(),role:text('role'),banned:integer('banned',{mode:'boolean'}).default(false),banReason:text('ban_reason'),banExpires:integer('ban_expires',{mode:'timestamp_ms'}),
});
export const authSession=sqliteTable('auth_session',{
 id:text('id').primaryKey(),token:text('token').notNull().unique(),userId:text('user_id').notNull().references(()=>authUser.id,{onDelete:'cascade'}),expiresAt:integer('expires_at',{mode:'timestamp_ms'}).notNull(),createdAt:integer('created_at',{mode:'timestamp_ms'}).notNull(),updatedAt:integer('updated_at',{mode:'timestamp_ms'}).notNull(),ipAddress:text('ip_address'),userAgent:text('user_agent'),impersonatedBy:text('impersonated_by'),
});
export const authAccount=sqliteTable('auth_account',{
 id:text('id').primaryKey(),accountId:text('account_id').notNull(),providerId:text('provider_id').notNull(),userId:text('user_id').notNull().references(()=>authUser.id,{onDelete:'cascade'}),accessToken:text('access_token'),refreshToken:text('refresh_token'),idToken:text('id_token'),accessTokenExpiresAt:integer('access_token_expires_at',{mode:'timestamp_ms'}),refreshTokenExpiresAt:integer('refresh_token_expires_at',{mode:'timestamp_ms'}),scope:text('scope'),password:text('password'),createdAt:integer('created_at',{mode:'timestamp_ms'}).notNull(),updatedAt:integer('updated_at',{mode:'timestamp_ms'}).notNull(),
});
export const authVerification=sqliteTable('auth_verification',{id:text('id').primaryKey(),identifier:text('identifier').notNull(),value:text('value').notNull(),expiresAt:integer('expires_at',{mode:'timestamp_ms'}).notNull(),createdAt:integer('created_at',{mode:'timestamp_ms'}).notNull(),updatedAt:integer('updated_at',{mode:'timestamp_ms'}).notNull()});
export const authRateLimit=sqliteTable('auth_rate_limit',{id:text('id').primaryKey(),key:text('key').notNull().unique(),count:integer('count').notNull(),lastRequest:integer('last_request').notNull()});
