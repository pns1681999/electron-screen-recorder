export const voiceCommandList = ['yes', 'no'] as const;
export type VoiceCommand = (typeof voiceCommandList)[number];

export class EdgeImpulsePostProcessor {
  /** Preserve the results of previous timeslices */
  currentDetectedResultList: DetectedResult[] = [];

  /**
   * Since the classification can return multiple results on the same voice
   * command (eg. We only say "yes" once but "yes" is returned in multiple
   * timeslices), this step is to "merge" those duplicate results into one,
   * and only count a voice command as detected if **a certain amount of results
   * is returned continously in a certain time window**.
   *
   * @param rawResults always contains a fixed number of results (which is the number of labels we trained)
   *  */
  processResultsContinuousSync(
    rawResults: { label: string; value: number }[]
  ): VoiceCommand | null {
    // Filter out the results that are below scoreThreshold & not included in
    // voiceCommandList
    let detectedResultListToAdd: DetectedResult[] = rawResults
      .filter(
        (rawResult): rawResult is { label: VoiceCommand; value: number } =>
          rawResult.value > EdgeImpulseConfigs.scoreThreshold &&
          voiceCommandList.includes(rawResult.label as VoiceCommand)
      )
      .map((rawResult) => ({
        detectedAt: new Date(),
        label: rawResult.label,
        score: rawResult.value,
      }));

    this.currentDetectedResultList.push(...detectedResultListToAdd);

    // Get all the results of the recent time window
    const recentDetectedResultList = this.currentDetectedResultList.filter(
      (detectedResult) => {
        const now = new Date();
        const durationInMs = Math.abs(
          now.getTime() - detectedResult.detectedAt.getTime()
        );

        return durationInMs <= EdgeImpulseConfigs.recentDurationInMsThreshold;
      }
    );

    // From the recent results, find the voice command that appear enough to be
    // considered as detected
    const foundVoiceCommand = voiceCommandList.find((voiceCommandLabel) => {
      const recentVoiceCommandCount = recentDetectedResultList.filter(
        (detectedResult) => detectedResult.label == voiceCommandLabel
      ).length;

      return (
        recentVoiceCommandCount >=
        EdgeImpulseConfigs.resultCountThresholdByVoiceCommand[voiceCommandLabel]
      );
    });

    if (foundVoiceCommand != null) {
      // Detected a voice command => clear the remaining results to prepare for
      // a new classification session
      this.currentDetectedResultList = [];
    }

    return foundVoiceCommand ?? null;
  }
}

class EdgeImpulseConfigs {
  static scoreThreshold = 0.7;

  /** This should be greater than the longest label's speech duration */
  static recentDurationInMsThreshold = 2000;

  /** The count thresholds depend on recorder's timeslice value and must be adjusted
   * accordingly */
  static resultCountThresholdByVoiceCommand: Record<VoiceCommand, number> = {
    yes: 3,
    no: 3,
  };
}

interface DetectedResult {
  detectedAt: Date;
  label: VoiceCommand;
  score: number;
}
