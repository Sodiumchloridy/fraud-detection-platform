package com.workshop.backend.mapper;

import com.workshop.backend.dto.TransactionEvent;
import com.workshop.backend.dto.TransactionRequest;
import com.workshop.backend.dto.TransactionFeatures;
import com.workshop.backend.model.Transaction;
import com.workshop.backend.model.TransactionFeature;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface TransactionMapper {

    @Mapping(target = "timestamp", ignore = true)
    Transaction toTransaction(TransactionRequest transactionRequest);

    TransactionFeature toTransactionFeature(TransactionFeatures features);

    default void applyFeatures(TransactionFeatures featuresDto, @MappingTarget Transaction transaction) {
        if (featuresDto == null) {
            return;
        }
        TransactionFeature feature = toTransactionFeature(featuresDto);
        feature.setTransaction(transaction);
        transaction.setFeatures(feature);
    }

    TransactionEvent toEvent(Transaction transaction);
}
