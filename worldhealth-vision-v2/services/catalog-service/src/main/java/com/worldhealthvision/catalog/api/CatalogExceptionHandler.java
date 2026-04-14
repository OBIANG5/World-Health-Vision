package com.worldhealthvision.catalog.api;

/*
==============================================================================
FICHIER : CatalogExceptionHandler.java

A QUOI SERT CE FICHIER ?
------------------------------------------------------------------------------
Centraliser les erreurs du catalog-service pour garantir un format d'erreur
HTTP lisible et coherent.
==============================================================================
*/

import com.worldhealthvision.catalog.service.CatalogNotFoundException;
import com.worldhealthvision.common.api.ApiErrorResponse;
import com.worldhealthvision.common.http.WhvHttpHeaders;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.time.OffsetDateTime;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class CatalogExceptionHandler {

    @ExceptionHandler(CatalogNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNotFound(
            CatalogNotFoundException exception,
            HttpServletRequest request
    ) {
        return buildResponse(HttpStatus.NOT_FOUND, exception.getMessage(), request);
    }

    @ExceptionHandler({
            MethodArgumentNotValidException.class,
            ConstraintViolationException.class
    })
    public ResponseEntity<ApiErrorResponse> handleBadRequest(
            Exception exception,
            HttpServletRequest request
    ) {
        return buildResponse(HttpStatus.BAD_REQUEST, exception.getMessage(), request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(
            Exception exception,
            HttpServletRequest request
    ) {
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected catalog-service error.", request);
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
