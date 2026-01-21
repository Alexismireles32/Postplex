import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Helper function to handle Prisma errors
export function handlePrismaError(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const prismaError = error as { code: string; meta?: { target?: string[] } };
    
    switch (prismaError.code) {
      case 'P2002':
        return `A record with this ${prismaError.meta?.target?.join(', ') || 'value'} already exists.`;
      case 'P2025':
        return 'Record not found.';
      case 'P2003':
        return 'Related record not found.';
      case 'P2016':
        return 'Query interpretation error.';
      default:
        return 'A database error occurred.';
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unknown database error occurred.';
}

// Helper function to check database connection
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
