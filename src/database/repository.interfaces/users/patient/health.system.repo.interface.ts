import { HealthSystemHospitalDomainModel } from
    "../../../../domain.types/users/patient/health.system/health.system.hospital.domain.model";
import { HealthSystemHospitalDto } from
    "../../../../domain.types/users/patient/health.system/health.system.hospital.dto";
import { HealthSystemDomainModel } from
    "../../../../domain.types/users/patient/health.system/health.system.domain.model";
import { HealthSystemDto } from "../../../../domain.types/users/patient/health.system/health.system.dto";
import { uuid } from "../../../../domain.types/miscellaneous/system.types";
import { HealthSystemSearchFilters, HealthSystemSearchResults }
    from "../../../../domain.types/users/patient/health.system/health.system.search.types";

export interface IHealthSystemRepo {

    createHealthSystem(healthSystemDomainModel: HealthSystemDomainModel): Promise<HealthSystemDto>;

    getHealthSystems(planName?: string): Promise<HealthSystemDto[]>;

    createHealthSystemHospital(model: HealthSystemHospitalDomainModel): Promise<HealthSystemHospitalDto>;

    getHealthSystemHospitals(healthSystemId: uuid): Promise<HealthSystemHospitalDto[]>;

    totalCount(): Promise<number>;

    searchType(filters: HealthSystemSearchFilters): Promise<HealthSystemSearchResults>;

}
