-- Add IMAGE to BYOAI model types for custom image generation endpoints.
ALTER TYPE "OrganizationAIModelType" ADD VALUE IF NOT EXISTS 'IMAGE';
