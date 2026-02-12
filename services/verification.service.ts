import { Escrow, EscrowStatus } from "@prisma/client";

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

/**
 * Task rules interface for agent output validation
 */
export interface TaskRules {
  requiredFields: string[];
  schema?: object;
  customValidators?: ((data: any) => boolean)[];
  minLength?: number;
  maxLength?: number;
}

/**
 * Approval result interface
 */
export interface ApprovalResult {
  approved: boolean;
  reason?: string;
  feedback?: string[];
}

/**
 * Escrow conditions interface
 */
export interface EscrowConditions {
  minAmount?: number;
  maxAmount?: number;
  requiresDescription?: boolean;
  allowedStatuses?: EscrowStatus[];
  minHoursSinceFunding?: number;
}

/**
 * Validate output format (schema validation)
 *
 * @param output - Data to validate
 * @param rules - Validation rules
 * @returns Validation result
 */
export function validateOutputFormat(
  output: unknown,
  rules?: TaskRules,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if output exists
  if (!output) {
    errors.push("Output is null or undefined");
    return { isValid: false, errors };
  }

  // Check if output is an object
  if (typeof output !== "object") {
    errors.push("Output must be an object");
    return { isValid: false, errors };
  }

  // If no rules provided, basic validation passes
  if (!rules) {
    return { isValid: true };
  }

  const data = output as Record<string, any>;

  // Check required fields
  if (rules.requiredFields) {
    for (const field of rules.requiredFields) {
      if (!(field in data)) {
        errors.push(`Missing required field: ${field}`);
      } else if (data[field] === null || data[field] === undefined) {
        errors.push(`Required field is null or undefined: ${field}`);
      }
    }
  }

  // Check min/max length for string fields
  if (rules.minLength || rules.maxLength) {
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "string") {
        if (rules.minLength && value.length < rules.minLength) {
          warnings.push(
            `Field "${key}" is shorter than minimum length ${rules.minLength}`,
          );
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(
            `Field "${key}" exceeds maximum length ${rules.maxLength}`,
          );
        }
      }
    }
  }

  // Run custom validators
  if (rules.customValidators) {
    for (let i = 0; i < rules.customValidators.length; i++) {
      const validator = rules.customValidators[i];
      try {
        if (!validator(data)) {
          errors.push(`Custom validator ${i + 1} failed`);
        }
      } catch (error) {
        errors.push(
          `Custom validator ${i + 1} threw error: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate data against task rules
 *
 * @param output - Output data to validate
 * @param rules - Task rules to validate against
 * @returns Validation result
 */
export function validateAgainstRules(
  output: any,
  rules: TaskRules,
): ValidationResult {
  // Delegate to validateOutputFormat for now
  // Can be extended with more specific rule checking
  return validateOutputFormat(output, rules);
}

/**
 * Approve or reject agent output based on validation
 *
 * @param output - Agent output to approve/reject
 * @param rules - Task rules for validation
 * @returns Approval result
 */
export function approveOrReject(output: any, rules: TaskRules): ApprovalResult {
  const validation = validateAgainstRules(output, rules);

  if (validation.isValid) {
    return {
      approved: true,
      feedback: validation.warnings,
    };
  }

  return {
    approved: false,
    reason: validation.errors
      ? validation.errors.join(", ")
      : "Validation failed",
    feedback: validation.errors,
  };
}

/**
 * Validate escrow conditions
 *
 * @param escrow - Escrow to validate
 * @param conditions - Conditions to check
 * @returns Validation result
 */
export function validateEscrowConditions(
  escrow: Escrow,
  conditions: EscrowConditions,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check amount range
  if (conditions.minAmount && escrow.amountBCH < conditions.minAmount) {
    errors.push(
      `Amount ${escrow.amountBCH} BCH is below minimum ${conditions.minAmount} BCH`,
    );
  }

  if (conditions.maxAmount && escrow.amountBCH > conditions.maxAmount) {
    errors.push(
      `Amount ${escrow.amountBCH} BCH exceeds maximum ${conditions.maxAmount} BCH`,
    );
  }

  // Check description
  if (conditions.requiresDescription && !escrow.description) {
    errors.push("Description is required");
  }

  // Check status
  if (
    conditions.allowedStatuses &&
    !conditions.allowedStatuses.includes(escrow.status)
  ) {
    errors.push(
      `Status ${escrow.status} is not in allowed statuses: ${conditions.allowedStatuses.join(", ")}`,
    );
  }

  // Check time since funding
  if (conditions.minHoursSinceFunding && escrow.fundedAt) {
    const hoursSinceFunding =
      (Date.now() - new Date(escrow.fundedAt).getTime()) / (1000 * 60 * 60);

    if (hoursSinceFunding < conditions.minHoursSinceFunding) {
      errors.push(
        `Only ${hoursSinceFunding.toFixed(1)} hours since funding, minimum ${conditions.minHoursSinceFunding} hours required`,
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate task completion data
 *
 * @param taskData - Task completion data
 * @returns Validation result
 */
export function validateTaskCompletion(taskData: {
  completed: boolean;
  result?: any;
  errors?: string[];
}): ValidationResult {
  const errors: string[] = [];

  if (typeof taskData.completed !== "boolean") {
    errors.push("Task completion status must be a boolean");
  }

  if (taskData.completed && !taskData.result) {
    errors.push("Completed tasks must have a result");
  }

  if (!taskData.completed && !taskData.errors) {
    errors.push("Incomplete tasks should provide error information");
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
