package com.workshop.backend.mapper;

import com.workshop.backend.dto.TransactionDto;
import com.workshop.backend.dto.TransactionFeaturesDto;
import com.workshop.backend.model.Transaction;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface TransactionMapper {

    TransactionMapper INSTANCE = Mappers.getMapper(TransactionMapper.class);

    Transaction toTransaction(TransactionDto transactionDto);

    void applyFeatures(TransactionFeaturesDto features, @MappingTarget Transaction transaction);
}
