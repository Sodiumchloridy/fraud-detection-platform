package com.workshop.backend.mapper;

import com.workshop.backend.dto.TransactionEvent;
import com.workshop.backend.dto.TransactionRequest;
import com.workshop.backend.dto.TransactionFeatures;
import com.workshop.backend.model.Transaction;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface TransactionMapper {

    @Mapping(target = "timestamp", ignore = true)
    Transaction toTransaction(TransactionRequest transactionRequest);

    void applyFeatures(TransactionFeatures features, @MappingTarget Transaction transaction);

    TransactionEvent toEvent(Transaction transaction);
}
