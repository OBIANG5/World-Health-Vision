package com.worldhealthvision.research.api;

import com.worldhealthvision.research.api.TradeCaseModels.CaseSummary;
import com.worldhealthvision.research.api.TradeCaseModels.CaseView;
import com.worldhealthvision.research.api.TradeCaseModels.RevisionView;
import com.worldhealthvision.research.api.TradeCaseModels.WriteRequest;
import com.worldhealthvision.research.repository.TradeCaseRepository;
import com.worldhealthvision.research.repository.TradeCaseRepository.Owner;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * No 'owner' input in any HTTP body or header. Source of principal identity
 * is the independently verified signed JWT, not the Gateway or browser.
 */
@RestController
@RequestMapping("/api/trading/cases")
public class TradeCaseController {
    private static final Pattern VERSION = Pattern.compile("\"v([1-9][0-9]*)\"");
    private final TradeCaseRepository repository;
    private final ResearchPlanValidation validation;

    public TradeCaseController(TradeCaseRepository repository, ResearchPlanValidation validation) {
        this.repository = repository;
        this.validation = validation;
    }

    @GetMapping
    public List<CaseSummary> list(@AuthenticationPrincipal Jwt jwt) {
        return repository.list(owner(jwt));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CaseView> get(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        CaseView result = repository.find(owner(jwt), id).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Research case not found"));
        return ResponseEntity.ok().eTag("v" + result.version()).body(result);
    }

    @GetMapping("/{id}/history")
    public List<RevisionView> history(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        Owner scoped = owner(jwt);
        if (repository.find(scoped, id).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Research case not found");
        }
        return repository.history(scoped, id);
    }

    @PostMapping
    public ResponseEntity<CaseView> create(@AuthenticationPrincipal Jwt jwt,
            @RequestBody WriteRequest request) {
        String json = validation.validate(request);
        CaseView result = repository.create(owner(jwt), request.title().trim(), json);
        return ResponseEntity.created(URI.create("/api/trading/cases/" + result.id()))
            .eTag("v" + result.version()).body(result);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CaseView> update(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
            @RequestHeader(value = "If-Match", required = false) String ifMatch,
            @RequestBody WriteRequest request) {
        long version = requirePrecondition(ifMatch);
        String json = validation.validate(request);
        CaseView result = repository.update(owner(jwt), id, version, request.title().trim(), json);
        return ResponseEntity.ok().eTag("v" + result.version()).body(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
            @RequestHeader(value = "If-Match", required = false) String ifMatch) {
        repository.delete(owner(jwt), id, requirePrecondition(ifMatch));
        return ResponseEntity.noContent().build();
    }

    private static Owner owner(Jwt jwt) {
        if (jwt == null || jwt.getIssuer() == null || jwt.getSubject() == null ||
            jwt.getSubject().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Verified user identity required");
        }
        return new Owner(jwt.getIssuer().toString(), jwt.getSubject());
    }

    private static long requirePrecondition(String header) {
        if (header == null || header.isBlank()) {
            throw new ResponseStatusException(HttpStatus.PRECONDITION_REQUIRED,
                "A versioned If-Match header is required to prevent lost updates");
        }
        Matcher match = VERSION.matcher(header);
        if (!match.matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Expected If-Match: \"vN\"");
        }
        try {
            return Long.parseLong(match.group(1));
        } catch (NumberFormatException invalid) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid version", invalid);
        }
    }
}
