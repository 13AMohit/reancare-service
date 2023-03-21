import { inject, injectable } from "tsyringe";
import { IBodyWeightRepo } from "../../database/repository.interfaces/clinical/biometrics/body.weight.repo.interface";
import { ConfigurationManager } from "../../config/configuration.manager";
import { BodyWeightStore } from "../../modules/ehr/services/body.weight.store";
import { Loader } from "../../startup/loader";
import { IBodyHeightRepo } from "../../database/repository.interfaces/clinical/biometrics/body.height.repo.interface";
import { ActivityDomainModel, ActivityType } from "../../domain.types/webhook/activity.domain.model";
import { IStepCountRepo } from "../../database/repository.interfaces/wellness/daily.records/step.count.interface";
import { ICalorieBalanceRepo } from "../../database/repository.interfaces/wellness/daily.records/calorie.balance.repo.interface";
import { PhysicalActivityCategories, Intensity } from "../../domain.types/wellness/exercise/physical.activity/physical.activity.types";
import { IPhysicalActivityRepo } from "../../database/repository.interfaces/wellness/exercise/physical.activity.repo.interface";
import { PhysicalActivityDomainModel } from "../../domain.types/wellness/exercise/physical.activity/physical.activity.domain.model";

////////////////////////////////////////////////////////////////////////////////////////////////////////

@injectable()
export class TeraWebhookActivityService {

    _ehrBodyWeightStore: BodyWeightStore = null;

    constructor(
        @inject('IBodyWeightRepo') private _bodyWeightRepo: IBodyWeightRepo,
        @inject('IBodyHeightRepo') private _bodyHeightRepo: IBodyHeightRepo,
        @inject('IStepCountRepo') private _stepCountRepo: IStepCountRepo,
        @inject('ICalorieBalanceRepo') private _calorieBalanceRepo: ICalorieBalanceRepo,
        @inject('IPhysicalActivityRepo') private _physicalActivityRepo: IPhysicalActivityRepo
    ) {
        if (ConfigurationManager.EhrEnabled()) {
            this._ehrBodyWeightStore = Loader.container.resolve(BodyWeightStore);
        }
    }

    activity = async (activityDomainModel: ActivityDomainModel) => {
        
        activityDomainModel.Data.forEach(async activity => {
            if (activity.DistanceData.Summary.Steps) {
                const entity = {
                    PatientUserId  : activityDomainModel.User.ReferenceId ?? null,
                    TerraSummaryId : activity.MetaData.SummaryId,
                    Provider       : activityDomainModel.User.Provider,
                    StepCount      : activity.DistanceData.Summary.Steps ?? null,
                    Unit           : "steps",
                    RecordDate     : new Date(activity.MetaData.StartTime) ?? null,
                };
                await this._stepCountRepo.create(entity);
            }

            const durationInMin = activity.ActiveDurationsData.ActivitySeconds / 60;
            const category = await this.getActivityType(activity.MetaData.Type);
            
            const activityModel : PhysicalActivityDomainModel = {
                PatientUserId  : activityDomainModel.User.ReferenceId,
                Exercise       : activity.MetaData.Name,
                Category       : category,
                Description    : ActivityType[activity.MetaData.Type],
                CaloriesBurned : activity.CaloriesData.NetActivityCalories,
                Intensity      : Intensity.Moderate,
                StartTime      : new Date(activity.MetaData.StartTime),
                EndTime        : new Date(activity.MetaData.EndTime),
                DurationInMin  : parseInt(`${durationInMin}`),
                TerraSummaryId : activity.MetaData.SummaryId,
                Provider       : activityDomainModel.User.Provider,
            };
            await this._physicalActivityRepo.create(activityModel);
        });
    };

    public getActivityType = async (type) => {

        let category = null;
        const activityType = ActivityType[type];

        const Aerobic = [ "BIKING", "RUNNING", "AEROBICS", "MOUNTAIN_BIKING", "ROAD_BIKING", "SPINNING", "STATIONARY_BIKING",
            "UTILITY_BIKING", "CALISTHENICS", "DANCING", "ELLIPTICAL", "FENCING", "FRISBEE", "GYMNASTICS", "HANDBALL", "HIKING",
            "HORSEBACK_RIDING", "JUMPING_ROPE", "KAYAKING", "KITESURFING", "MEDITATION", "PARAGLIDING", "PILATES", "POLO",
            "RACQUETBALL", "ROCK_CLIMBING", "ROWING", "SAILING", "SCUBA_DIVING", "SKATEBOARDING", "SKATING", "INDOOR_ROLLERBLADING",
            "SQUASH", "STAIR_CLIMBING", "STAND_UP_PADDLEBOARDING", "SURFING", "SWIMMING", "SWIMMING_SWIMMING_POOL", "SWIMMING_OPEN_WATER",
            "NORDIC_WALKING", "WALKING_TREADMILL", "WATERPOLO", "WINDSURFING", "ZUMBA", "DIVING", "ICE_SKATING", "INDOOR_SKATING" ];

        const Anaerobic = [ "BIATHLON", "HANDBIKING", "SPRINTING", "KITE_SKIING", "ROLLER_SKIING",
            "SLEDDING", "SNOWBOARDING", "SNOWMOBILE", "SNOWSHOEING", "HIIT"];

        const Strength_Training = ["WEIGHTLIFTING", "KETTLEBELL_TRAINING", "ROWING", "ROWING_MACHINE", "STAIR_CLIMBING", "STAIR_CLIMBING_MACHINE",
            "PARAGLIDING", "ROCK_CLIMBING", "CROSSFIT", "INTERVAL_TRAINING", "CIRCUIT_TRAINING"];

        const YogAsanas = ["YOGA"];

        const Athletic_Training =  [ "BADMINTON", "BASEBALL", "BASKETBALL", "HOCKEY", "TENNIS", "TREADMILL", "VOLLEYBALL_BEACH",
            "VOLLEYBALL_INDOOR", "WAKEBOARDING", "WALKING_FITNESS", "TENNIS", "VOLLEYBALL","TEAM_SPORTS", "TABLE_TENNIS","KICKBOXING",
            "BOXING", "AMERICAN_FOOTBALL", "AUSTRALIAN_FOOTBALL", "MARTIAL_ARTS", "P90X_EXERCISES", "MIXED_MARTIAL_ARTS", "ENGLISH_FOOTBALL",
            "CRICKET", "RUGBY", "JOGGING", "RUNNING_ON_SAND", "TREADMILL_RUNNING"];

        // const Other = ["STILL", "UNKNOWN", "TILTING", "WALKING", "HOUSEWORK", "WALKING_STROLLER", "ELEVATOR", "ESCALATOR",
        //     "ARCHERY", "SOFTBALL", "GARDENING", "GUIDED_BREATHING", "CURLING", "OTHER"];

        if (Aerobic.includes(activityType)) {
            category = PhysicalActivityCategories.Aerobic;
        } else if (Anaerobic.includes(activityType)) {
            category = PhysicalActivityCategories.Anaerobic;
        } else if (Strength_Training.includes(activityType)) {
            category = PhysicalActivityCategories.StrengthTraining;
        } else  if (YogAsanas.includes(activityType)) {
            category = PhysicalActivityCategories.YogAsanas;
        } else if (Athletic_Training.includes(activityType)) {
            category = PhysicalActivityCategories.AtheleticTraining;
        } else {
            category = PhysicalActivityCategories.Other;
        }

        return category;
    };

}