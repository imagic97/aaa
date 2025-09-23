ts 实现：
主入口文件：index.ts
CronJob 类
1、功能：提供 nodejs 执行循环定时执行任务，register 方法注册定时任务，start 方法启动定时任务
2、jobs 属性：存储定时任务的数组，数组中存储定时任务的 function 、cronTime、immediate、intervalId
3、register 实现：入参 function、cronTime、immediate=false，返回 void，将function 和 cronTime（秒） 存储到数组中,等待 start 方法执行
4、start 实现：启动定时任务，根据执行数组中存储的 crontime 循环执行定时任务，每间隔 crontime 执行一次 function，存储停止定时任务的函数 intervalId
5、stop 实现：根据 jobs 的 intervalId，停止定时任务
