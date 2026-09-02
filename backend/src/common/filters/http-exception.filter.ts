import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalException')

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx      = host.switchToHttp()
    const response = ctx.getResponse()
    const request  = ctx.getRequest()

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR

    // For HttpExceptions (including ValidationPipe errors), extract the full response
    // so the frontend receives the detailed validation messages array
    let message: string | string[] = 'Error interno del servidor'
    if (exception instanceof HttpException) {
      const exResponse = exception.getResponse()
      if (typeof exResponse === 'object' && exResponse !== null) {
        // ValidationPipe sets { statusCode, message: string[], error }
        const r = exResponse as Record<string, unknown>
        message = (r.message as string | string[]) ?? exception.message
      } else {
        message = exception.message
      }
    }

    // Log full stack internally only
    this.logger.error(
      `[${request.method} ${request.url}] ${status}`,
      exception instanceof Error ? exception.stack : String(exception),
    )

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    })
  }
}
