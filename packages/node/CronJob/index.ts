interface ScheduledJob {
  func: () => void;
  cronTime: number;
  immediate: boolean;
  intervalId?: NodeJS.Timeout;
}

class CronJob {
  private jobs: ScheduledJob[] = [];

  /**
   * 注册定时任务
   * @param func - 需要定时执行的函数
   * @param cronTime - 定时执行间隔（秒）
   * @param immediate - 是否立即执行（默认为 false）
   */
  register(func: () => void, cronTime: number, immediate = false): void {
    if (typeof func !== 'function') {
      throw new Error('Function parameter must be a function');
    }
    if (typeof cronTime !== 'number' || cronTime <= 0) {
      throw new Error('cronTime must be a positive number');
    }

    this.jobs.push({ func, cronTime, immediate });
  }

  /**
   * 启动所有已注册的定时任务
   */
  start(): void {
    this.jobs.forEach((job) => {
      if (!job.intervalId) {
        job.intervalId = setInterval(job.func, job.cronTime * 1000);
        if (job.immediate) {
          job.func();
        }
      }
    });
  }

  /**
   * 停止所有定时任务
   */
  stop(): void {
    this.jobs.forEach((job) => {
      if (job.intervalId) {
        clearInterval(job.intervalId);
        job.intervalId = undefined;
      }
    });
  }

  /**
   * 清除所有定时任务
   */
  clear(): void {
    this.stop();
    this.jobs = [];
  }
}

export default CronJob;