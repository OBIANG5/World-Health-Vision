package com.worldhealthvision.timeseries.api;

import com.worldhealthvision.common.api.ApiErrorResponse;
import com.worldhealthvision.common.http.WhvHttpHeaders;
import com.worldhealthvision.timeseries.persistence.ImmutableSourceRunConflictException;
import com.worldhealthvision.timeseries.service.ProtectedResearchPublicationException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.time.OffsetDateTime;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class TimeseriesExceptionHandler {

    @ExceptionHandler({
            MethodArgumentNotValidException.class,
            ConstraintViolationException.class,
            DataIntegrityViolationException.class,
            IllegalArgumentException.class,
            HttpMessageNotReadableException.class
    })
    public ResponseEntity<ApiErrorResponse> handleBadRequest(
            Exception exception,
            HttpServletRequest request
    ) {
        // Do not echo JDBC constraint details, input values, token fragments or
        // arbitrary JSON parsing exceptions to callers.
        return buildResponse(HttpStatus.BAD_REQUEST,
                "Invalid Timeseries request or source constraint.", request);
    }

    @ExceptionHandler(ProtectedResearchPublicationException.class)
    public ResponseEntity<ApiErrorResponse> handlePrivateResearchDenied(
            ProtectedResearchPublicationException exception, HttpServletRequest request
    ) {
        return buildResponse(HttpStatus.FORBIDDEN,
                "This source observation is not authorized for Timeseries publication.", request);
    }

    @ExceptionHandler(ImmutableSourceRunConflictException.class)
    public ResponseEntity<ApiErrorResponse> handleSourceVersionConflict(
            ImmutableSourceRunConflictException exception, HttpServletRequest request
    ) {
        return buildResponse(HttpStatus.CONFLICT,
                "Source run key already exists with different or unverified immutable content.", request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(
            Exception exception,
            HttpServletRequest request
    ) {
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected timeseries-service error.", request);
    }

    private ResponseEntity<ApiErrorResponse> buildResponse(
            HttpStatus status,
            String message,
            HttpServletRequest request
    ) {
        String correlationId = request.getHeader(WhvHttpHeaders.X_CORRELATION_ID);

        ApiErrorResponse body = new ApiErrorResponse(
                OffsetDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                message,
                request.getRequestURI(),
                correlationId
        );

        return ResponseEntity.status(status).body(body);
    }
}