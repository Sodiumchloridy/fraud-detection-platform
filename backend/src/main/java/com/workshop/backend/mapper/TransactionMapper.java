package com.workshop.backend.mapper;

import com.workshop.backend.dto.TransactionDto;
import com.workshop.backend.dto.TransactionFeaturesDto;
import com.workshop.backend.model.Transaction;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface TransactionMapper {

    @Mapping(target = "timestamp", ignore = true)
    Transaction toTransaction(TransactionDto transactionDto);

    void applyFeatures(TransactionFeaturesDto features, @MappingTarget Transaction transaction);
}
