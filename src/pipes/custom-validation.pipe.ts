import {
    PipeTransform,
    ArgumentMetadata,
    BadRequestException,
    ValidationError,
    Logger
} from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';

export class CustomValidationPipe extends ValidationPipe implements PipeTransform<any> {
    private readonly logger = new Logger(CustomValidationPipe.name);

    constructor() {
        super({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
            forbidUnknownValues: true,
            enableDebugMessages: true,
            exceptionFactory: (errors: ValidationError[]) => {
                const formattedErrors = this.formatErrors(errors);
                const response = {
                    statusCode: 400,
                    message: 'Validation failed',
                    errors: formattedErrors
                };

                this.logger.debug(`Validation failed: ${JSON.stringify(response, null, 2)}`);

                throw new BadRequestException(response);
            }
        });
    }

    private formatErrors(errors: ValidationError[]): Record<string, any> {
        return errors.reduce((acc, error) => {
            if (error.children && error.children.length > 0) {
                acc[error.property] = this.formatErrors(error.children);
            } else {
                acc[error.property] = this.getErrorMessages(error);
            }
            return acc;
        }, {});
    }

    private getErrorMessages(error: ValidationError): string[] {
        const messages: string[] = [];

        if (error.constraints) {
            messages.push(...Object.values(error.constraints).map(message =>
                this.humanizeErrorMessage(error.property, message)
            ));
        }

        return messages;
    }

    private humanizeErrorMessage(property: string, message: string): string {
        // Convert camelCase to space-separated words
        const humanProperty = property
            .replace(/([A-Z])/g, ' $1')
            .toLowerCase()
            .trim();

        // Clean up the message
        let humanMessage = message
            .replace(property, humanProperty)
            .replace(/^\w+\s/, ''); // Remove the constraint name

        // Make the first letter uppercase
        humanMessage = humanMessage.charAt(0).toUpperCase() + humanMessage.slice(1);

        return humanMessage;
    }
}