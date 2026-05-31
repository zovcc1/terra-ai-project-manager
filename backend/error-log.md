[INFO] Error stacktraces are turned on.
[INFO] Scanning for projects...
[INFO] 
[INFO] -------------------------< com.terra:backend >--------------------------
[INFO] Building terra-backend 0.0.1-SNAPSHOT
[INFO]   from pom.xml
[INFO] --------------------------------[ jar ]---------------------------------
[INFO] 
[INFO] >>> spring-boot:3.2.5:run (default-cli) > test-compile @ backend >>>
[INFO] 
[INFO] --- resources:3.3.1:resources (default-resources) @ backend ---
[INFO] Copying 1 resource from src/main/resources to target/classes
[INFO] Copying 0 resource from src/main/resources to target/classes
[INFO] 
[INFO] --- compiler:3.11.0:compile (default-compile) @ backend ---
[INFO] Nothing to compile - all classes are up to date
[INFO] 
[INFO] --- resources:3.3.1:testResources (default-testResources) @ backend ---
[INFO] skip non existing resourceDirectory /home/kasem/Documents/freelance/ai-project-manager/backend/src/test/resources
[INFO] 
[INFO] --- compiler:3.11.0:testCompile (default-testCompile) @ backend ---
[INFO] Nothing to compile - all classes are up to date
[INFO] 
[INFO] <<< spring-boot:3.2.5:run (default-cli) < test-compile @ backend <<<
[INFO] 
[INFO] 
[INFO] --- spring-boot:3.2.5:run (default-cli) @ backend ---
[INFO] Attaching agents: []

  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.2.5)

2026-05-26 16:32:38 - Starting TerraBackendApplication using Java 21.0.11 with PID 646849 (/home/kasem/Documents/freelance/ai-project-manager/backend/target/classes started by kasem in /home/kasem/Documents/freelance/ai-project-manager/backend)
2026-05-26 16:32:38 - No active profile set, falling back to 1 default profile: "default"
2026-05-26 16:32:39 - Multiple Spring Data modules found, entering strict repository configuration mode
2026-05-26 16:32:39 - Bootstrapping Spring Data JPA repositories in DEFAULT mode.
2026-05-26 16:32:39 - Finished Spring Data repository scanning in 191 ms. Found 10 JPA repository interfaces.
2026-05-26 16:32:39 - Multiple Spring Data modules found, entering strict repository configuration mode
2026-05-26 16:32:39 - Bootstrapping Spring Data Redis repositories in DEFAULT mode.
2026-05-26 16:32:39 - Spring Data Redis - Could not safely identify store assignment for repository candidate interface com.terra.backend.repository.AiSuggestionLogRepository; If you want this repository to be a Redis repository, consider annotating your entities with one of these annotations: org.springframework.data.redis.core.RedisHash (preferred), or consider extending one of the following types with your repository: org.springframework.data.keyvalue.repository.KeyValueRepository
2026-05-26 16:32:39 - Spring Data Redis - Could not safely identify store assignment for repository candidate interface com.terra.backend.repository.CommentRepository; If you want this repository to be a Redis repository, consider annotating your entities with one of these annotations: org.springframework.data.redis.core.RedisHash (preferred), or consider extending one of the following types with your repository: org.springframework.data.keyvalue.repository.KeyValueRepository
2026-05-26 16:32:39 - Spring Data Redis - Could not safely identify store assignment for repository candidate interface com.terra.backend.repository.NotificationRepository; If you want this repository to be a Redis repository, consider annotating your entities with one of these annotations: org.springframework.data.redis.core.RedisHash (preferred), or consider extending one of the following types with your repository: org.springframework.data.keyvalue.repository.KeyValueRepository
2026-05-26 16:32:39 - Spring Data Redis - Could not safely identify store assignment for repository candidate interface com.terra.backend.repository.PendingActionRepository; If you want this repository to be a Redis repository, consider annotating your entities with one of these annotations: org.springframework.data.redis.core.RedisHash (preferred), or consider extending one of the following types with your repository: org.springframework.data.keyvalue.repository.KeyValueRepository
2026-05-26 16:32:39 - Spring Data Redis - Could not safely identify store assignment for repository candidate interface com.terra.backend.repository.ProjectRepository; If you want this repository to be a Redis repository, consider annotating your entities with one of these annotations: org.springframework.data.redis.core.RedisHash (preferred), or consider extending one of the following types with your repository: org.springframework.data.keyvalue.repository.KeyValueRepository
2026-05-26 16:32:39 - Spring Data Redis - Could not safely identify store assignment for repository candidate interface com.terra.backend.repository.SkillRepository; If you want this repository to be a Redis repository, consider annotating your entities with one of these annotations: org.springframework.data.redis.core.RedisHash (preferred), or consider extending one of the following types with your repository: org.springframework.data.keyvalue.repository.KeyValueRepository
2026-05-26 16:32:39 - Spring Data Redis - Could not safely identify store assignment for repository candidate interface com.terra.backend.repository.TaskRepository; If you want this repository to be a Redis repository, consider annotating your entities with one of these annotations: org.springframework.data.redis.core.RedisHash (preferred), or consider extending one of the following types with your repository: org.springframework.data.keyvalue.repository.KeyValueRepository
2026-05-26 16:32:39 - Spring Data Redis - Could not safely identify store assignment for repository candidate interface com.terra.backend.repository.TeamRepository; If you want this repository to be a Redis repository, consider annotating your entities with one of these annotations: org.springframework.data.redis.core.RedisHash (preferred), or consider extending one of the following types with your repository: org.springframework.data.keyvalue.repository.KeyValueRepository
2026-05-26 16:32:39 - Spring Data Redis - Could not safely identify store assignment for repository candidate interface com.terra.backend.repository.UserRepository; If you want this repository to be a Redis repository, consider annotating your entities with one of these annotations: org.springframework.data.redis.core.RedisHash (preferred), or consider extending one of the following types with your repository: org.springframework.data.keyvalue.repository.KeyValueRepository
2026-05-26 16:32:39 - Spring Data Redis - Could not safely identify store assignment for repository candidate interface com.terra.backend.repository.UserSkillRepository; If you want this repository to be a Redis repository, consider annotating your entities with one of these annotations: org.springframework.data.redis.core.RedisHash (preferred), or consider extending one of the following types with your repository: org.springframework.data.keyvalue.repository.KeyValueRepository
2026-05-26 16:32:39 - Finished Spring Data repository scanning in 10 ms. Found 0 Redis repository interfaces.
2026-05-26 16:32:40 - Tomcat initialized with port 8080 (http)
2026-05-26 16:32:40 - Starting service [Tomcat]
2026-05-26 16:32:40 - Starting Servlet engine: [Apache Tomcat/10.1.20]
2026-05-26 16:32:40 - Initializing Spring embedded WebApplicationContext
2026-05-26 16:32:40 - Root WebApplicationContext: initialization completed in 2089 ms
2026-05-26 16:32:40 - HHH000204: Processing PersistenceUnitInfo [name: default]
2026-05-26 16:32:40 - HHH000412: Hibernate ORM core version 6.4.4.Final
2026-05-26 16:32:40 - HHH000026: Second-level cache disabled
2026-05-26 16:32:41 - No LoadTimeWeaver setup: ignoring JPA class transformer
2026-05-26 16:32:41 - HikariPool-1 - Starting...
2026-05-26 16:32:41 - HHH000342: Could not obtain connection to query metadata
java.lang.RuntimeException: Driver org.mariadb.jdbc.Driver claims to not accept jdbcUrl, DB_URL=jdbc:mariadb://localhost:3306/web_secure_jwt?createDatabaseIfNotExist=true
	at com.zaxxer.hikari.util.DriverDataSource.<init>(DriverDataSource.java:110)
	at com.zaxxer.hikari.pool.PoolBase.initializeDataSource(PoolBase.java:326)
	at com.zaxxer.hikari.pool.PoolBase.<init>(PoolBase.java:112)
	at com.zaxxer.hikari.pool.HikariPool.<init>(HikariPool.java:93)
	at com.zaxxer.hikari.HikariDataSource.getConnection(HikariDataSource.java:112)
	at org.hibernate.engine.jdbc.connections.internal.DatasourceConnectionProviderImpl.getConnection(DatasourceConnectionProviderImpl.java:122)
	at org.hibernate.engine.jdbc.env.internal.JdbcEnvironmentInitiator$ConnectionProviderJdbcConnectionAccess.obtainConnection(JdbcEnvironmentInitiator.java:428)
	at org.hibernate.resource.transaction.backend.jdbc.internal.JdbcIsolationDelegate.delegateWork(JdbcIsolationDelegate.java:61)
	at org.hibernate.engine.jdbc.env.internal.JdbcEnvironmentInitiator.getJdbcEnvironmentUsingJdbcMetadata(JdbcEnvironmentInitiator.java:276)
	at org.hibernate.engine.jdbc.env.internal.JdbcEnvironmentInitiator.initiateService(JdbcEnvironmentInitiator.java:107)
	at org.hibernate.engine.jdbc.env.internal.JdbcEnvironmentInitiator.initiateService(JdbcEnvironmentInitiator.java:68)
	at org.hibernate.boot.registry.internal.StandardServiceRegistryImpl.initiateService(StandardServiceRegistryImpl.java:130)
	at org.hibernate.service.internal.AbstractServiceRegistryImpl.createService(AbstractServiceRegistryImpl.java:263)
	at org.hibernate.service.internal.AbstractServiceRegistryImpl.initializeService(AbstractServiceRegistryImpl.java:238)
	at org.hibernate.service.internal.AbstractServiceRegistryImpl.getService(AbstractServiceRegistryImpl.java:215)
	at org.hibernate.boot.model.relational.Database.<init>(Database.java:45)
	at org.hibernate.boot.internal.InFlightMetadataCollectorImpl.getDatabase(InFlightMetadataCollectorImpl.java:223)
	at org.hibernate.boot.internal.InFlightMetadataCollectorImpl.<init>(InFlightMetadataCollectorImpl.java:191)
	at org.hibernate.boot.model.process.spi.MetadataBuildingProcess.complete(MetadataBuildingProcess.java:170)
	at org.hibernate.jpa.boot.internal.EntityManagerFactoryBuilderImpl.metadata(EntityManagerFactoryBuilderImpl.java:1432)
	at org.hibernate.jpa.boot.internal.EntityManagerFactoryBuilderImpl.build(EntityManagerFactoryBuilderImpl.java:1503)
	at org.springframework.orm.jpa.vendor.SpringHibernateJpaPersistenceProvider.createContainerEntityManagerFactory(SpringHibernateJpaPersistenceProvider.java:75)
	at org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean.createNativeEntityManagerFactory(LocalContainerEntityManagerFactoryBean.java:390)
	at org.springframework.orm.jpa.AbstractEntityManagerFactoryBean.buildNativeEntityManagerFactory(AbstractEntityManagerFactoryBean.java:409)
	at org.springframework.orm.jpa.AbstractEntityManagerFactoryBean.afterPropertiesSet(AbstractEntityManagerFactoryBean.java:396)
	at org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean.afterPropertiesSet(LocalContainerEntityManagerFactoryBean.java:366)
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.invokeInitMethods(AbstractAutowireCapableBeanFactory.java:1833)
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.initializeBean(AbstractAutowireCapableBeanFactory.java:1782)
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.doCreateBean(AbstractAutowireCapableBeanFactory.java:600)
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.createBean(AbstractAutowireCapableBeanFactory.java:522)
	at org.springframework.beans.factory.support.AbstractBeanFactory.lambda$doGetBean$0(AbstractBeanFactory.java:326)
	at org.springframework.beans.factory.support.DefaultSingletonBeanRegistry.getSingleton(DefaultSingletonBeanRegistry.java:234)
	at org.springframework.beans.factory.support.AbstractBeanFactory.doGetBean(AbstractBeanFactory.java:324)
	at org.springframework.beans.factory.support.AbstractBeanFactory.getBean(AbstractBeanFactory.java:200)
	at org.springframework.context.support.AbstractApplicationContext.getBean(AbstractApplicationContext.java:1234)
	at org.springframework.context.support.AbstractApplicationContext.finishBeanFactoryInitialization(AbstractApplicationContext.java:952)
	at org.springframework.context.support.AbstractApplicationContext.refresh(AbstractApplicationContext.java:624)
	at org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext.refresh(ServletWebServerApplicationContext.java:146)
	at org.springframework.boot.SpringApplication.refresh(SpringApplication.java:754)
	at org.springframework.boot.SpringApplication.refreshContext(SpringApplication.java:456)
	at org.springframework.boot.SpringApplication.run(SpringApplication.java:334)
	at org.springframework.boot.SpringApplication.run(SpringApplication.java:1354)
	at org.springframework.boot.SpringApplication.run(SpringApplication.java:1343)
	at com.terra.backend.TerraBackendApplication.main(TerraBackendApplication.java:11)
2026-05-26 16:32:41 - HHH90000025: MariaDBDialect does not need to be specified explicitly using 'hibernate.dialect' (remove the property setting and it will be selected by default)
2026-05-26 16:32:42 - HHH000489: No JTA platform available (set 'hibernate.transaction.jta.platform' to enable JTA platform integration)
2026-05-26 16:32:42 - HikariPool-1 - Starting...
2026-05-26 16:32:42 - Failed to initialize JPA EntityManagerFactory: [PersistenceUnit: default] Unable to build Hibernate SessionFactory; nested exception is java.lang.RuntimeException: Driver org.mariadb.jdbc.Driver claims to not accept jdbcUrl, DB_URL=jdbc:mariadb://localhost:3306/web_secure_jwt?createDatabaseIfNotExist=true
2026-05-26 16:32:42 - Exception encountered during context initialization - cancelling refresh attempt: org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'entityManagerFactory' defined in class path resource [org/springframework/boot/autoconfigure/orm/jpa/HibernateJpaConfiguration.class]: [PersistenceUnit: default] Unable to build Hibernate SessionFactory; nested exception is java.lang.RuntimeException: Driver org.mariadb.jdbc.Driver claims to not accept jdbcUrl, DB_URL=jdbc:mariadb://localhost:3306/web_secure_jwt?createDatabaseIfNotExist=true
2026-05-26 16:32:42 - Stopping service [Tomcat]
2026-05-26 16:32:42 - 

Error starting ApplicationContext. To display the condition evaluation report re-run your application with 'debug' enabled.
2026-05-26 16:32:42 - Application run failed
org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'entityManagerFactory' defined in class path resource [org/springframework/boot/autoconfigure/orm/jpa/HibernateJpaConfiguration.class]: [PersistenceUnit: default] Unable to build Hibernate SessionFactory; nested exception is java.lang.RuntimeException: Driver org.mariadb.jdbc.Driver claims to not accept jdbcUrl, DB_URL=jdbc:mariadb://localhost:3306/web_secure_jwt?createDatabaseIfNotExist=true
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.initializeBean(AbstractAutowireCapableBeanFactory.java:1786)
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.doCreateBean(AbstractAutowireCapableBeanFactory.java:600)
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.createBean(AbstractAutowireCapableBeanFactory.java:522)
	at org.springframework.beans.factory.support.AbstractBeanFactory.lambda$doGetBean$0(AbstractBeanFactory.java:326)
	at org.springframework.beans.factory.support.DefaultSingletonBeanRegistry.getSingleton(DefaultSingletonBeanRegistry.java:234)
	at org.springframework.beans.factory.support.AbstractBeanFactory.doGetBean(AbstractBeanFactory.java:324)
	at org.springframework.beans.factory.support.AbstractBeanFactory.getBean(AbstractBeanFactory.java:200)
	at org.springframework.context.support.AbstractApplicationContext.getBean(AbstractApplicationContext.java:1234)
	at org.springframework.context.support.AbstractApplicationContext.finishBeanFactoryInitialization(AbstractApplicationContext.java:952)
	at org.springframework.context.support.AbstractApplicationContext.refresh(AbstractApplicationContext.java:624)
	at org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext.refresh(ServletWebServerApplicationContext.java:146)
	at org.springframework.boot.SpringApplication.refresh(SpringApplication.java:754)
	at org.springframework.boot.SpringApplication.refreshContext(SpringApplication.java:456)
	at org.springframework.boot.SpringApplication.run(SpringApplication.java:334)
	at org.springframework.boot.SpringApplication.run(SpringApplication.java:1354)
	at org.springframework.boot.SpringApplication.run(SpringApplication.java:1343)
	at com.terra.backend.TerraBackendApplication.main(TerraBackendApplication.java:11)
Caused by: jakarta.persistence.PersistenceException: [PersistenceUnit: default] Unable to build Hibernate SessionFactory; nested exception is java.lang.RuntimeException: Driver org.mariadb.jdbc.Driver claims to not accept jdbcUrl, DB_URL=jdbc:mariadb://localhost:3306/web_secure_jwt?createDatabaseIfNotExist=true
	at org.springframework.orm.jpa.AbstractEntityManagerFactoryBean.buildNativeEntityManagerFactory(AbstractEntityManagerFactoryBean.java:421)
	at org.springframework.orm.jpa.AbstractEntityManagerFactoryBean.afterPropertiesSet(AbstractEntityManagerFactoryBean.java:396)
	at org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean.afterPropertiesSet(LocalContainerEntityManagerFactoryBean.java:366)
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.invokeInitMethods(AbstractAutowireCapableBeanFactory.java:1833)
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.initializeBean(AbstractAutowireCapableBeanFactory.java:1782)
	... 16 common frames omitted
Caused by: java.lang.RuntimeException: Driver org.mariadb.jdbc.Driver claims to not accept jdbcUrl, DB_URL=jdbc:mariadb://localhost:3306/web_secure_jwt?createDatabaseIfNotExist=true
	at com.zaxxer.hikari.util.DriverDataSource.<init>(DriverDataSource.java:110)
	at com.zaxxer.hikari.pool.PoolBase.initializeDataSource(PoolBase.java:326)
	at com.zaxxer.hikari.pool.PoolBase.<init>(PoolBase.java:112)
	at com.zaxxer.hikari.pool.HikariPool.<init>(HikariPool.java:93)
	at com.zaxxer.hikari.HikariDataSource.getConnection(HikariDataSource.java:112)
	at org.hibernate.engine.jdbc.connections.internal.DatasourceConnectionProviderImpl.getConnection(DatasourceConnectionProviderImpl.java:122)
	at org.hibernate.engine.jdbc.env.internal.JdbcEnvironmentInitiator$ConnectionProviderJdbcConnectionAccess.obtainConnection(JdbcEnvironmentInitiator.java:428)
	at org.hibernate.resource.transaction.backend.jdbc.internal.DdlTransactionIsolatorNonJtaImpl.getIsolatedConnection(DdlTransactionIsolatorNonJtaImpl.java:46)
	at org.hibernate.resource.transaction.backend.jdbc.internal.DdlTransactionIsolatorNonJtaImpl.getIsolatedConnection(DdlTransactionIsolatorNonJtaImpl.java:39)
	at org.hibernate.tool.schema.internal.exec.ImprovedExtractionContextImpl.getJdbcConnection(ImprovedExtractionContextImpl.java:63)
	at org.hibernate.tool.schema.extract.spi.ExtractionContext.getQueryResults(ExtractionContext.java:43)
	at org.hibernate.tool.schema.extract.internal.SequenceInformationExtractorMariaDBDatabaseImpl.extractMetadata(SequenceInformationExtractorMariaDBDatabaseImpl.java:46)
	at org.hibernate.tool.schema.extract.internal.DatabaseInformationImpl.initializeSequences(DatabaseInformationImpl.java:66)
	at org.hibernate.tool.schema.extract.internal.DatabaseInformationImpl.<init>(DatabaseInformationImpl.java:60)
	at org.hibernate.tool.schema.internal.Helper.buildDatabaseInformation(Helper.java:185)
	at org.hibernate.tool.schema.internal.AbstractSchemaMigrator.doMigration(AbstractSchemaMigrator.java:98)
	at org.hibernate.tool.schema.spi.SchemaManagementToolCoordinator.performDatabaseAction(SchemaManagementToolCoordinator.java:286)
	at org.hibernate.tool.schema.spi.SchemaManagementToolCoordinator.lambda$process$5(SchemaManagementToolCoordinator.java:145)
	at java.base/java.util.HashMap.forEach(HashMap.java:1429)
	at org.hibernate.tool.schema.spi.SchemaManagementToolCoordinator.process(SchemaManagementToolCoordinator.java:142)
	at org.hibernate.boot.internal.SessionFactoryObserverForSchemaExport.sessionFactoryCreated(SessionFactoryObserverForSchemaExport.java:37)
	at org.hibernate.internal.SessionFactoryObserverChain.sessionFactoryCreated(SessionFactoryObserverChain.java:35)
	at org.hibernate.internal.SessionFactoryImpl.<init>(SessionFactoryImpl.java:315)
	at org.hibernate.boot.internal.SessionFactoryBuilderImpl.build(SessionFactoryBuilderImpl.java:450)
	at org.hibernate.jpa.boot.internal.EntityManagerFactoryBuilderImpl.build(EntityManagerFactoryBuilderImpl.java:1507)
	at org.springframework.orm.jpa.vendor.SpringHibernateJpaPersistenceProvider.createContainerEntityManagerFactory(SpringHibernateJpaPersistenceProvider.java:75)
	at org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean.createNativeEntityManagerFactory(LocalContainerEntityManagerFactoryBean.java:390)
	at org.springframework.orm.jpa.AbstractEntityManagerFactoryBean.buildNativeEntityManagerFactory(AbstractEntityManagerFactoryBean.java:409)
	... 20 common frames omitted
[INFO] ------------------------------------------------------------------------
[INFO] BUILD FAILURE
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  6.632 s
[INFO] Finished at: 2026-05-26T16:32:42+03:00
[INFO] ------------------------------------------------------------------------
[ERROR] Failed to execute goal org.springframework.boot:spring-boot-maven-plugin:3.2.5:run (default-cli) on project backend: Process terminated with exit code: 1 -> [Help 1]
org.apache.maven.lifecycle.LifecycleExecutionException: Failed to execute goal org.springframework.boot:spring-boot-maven-plugin:3.2.5:run (default-cli) on project backend: Process terminated with exit code: 1
    at org.apache.maven.lifecycle.internal.MojoExecutor.doExecute2 (MojoExecutor.java:333)
    at org.apache.maven.lifecycle.internal.MojoExecutor.doExecute (MojoExecutor.java:316)
    at org.apache.maven.lifecycle.internal.MojoExecutor.execute (MojoExecutor.java:212)
    at org.apache.maven.lifecycle.internal.MojoExecutor.execute (MojoExecutor.java:174)
    at org.apache.maven.lifecycle.internal.MojoExecutor.access$000 (MojoExecutor.java:75)
    at org.apache.maven.lifecycle.internal.MojoExecutor$1.run (MojoExecutor.java:162)
    at org.apache.maven.plugin.DefaultMojosExecutionStrategy.execute (DefaultMojosExecutionStrategy.java:39)
    at org.apache.maven.lifecycle.internal.MojoExecutor.execute (MojoExecutor.java:159)
    at org.apache.maven.lifecycle.internal.LifecycleModuleBuilder.buildProject (LifecycleModuleBuilder.java:105)
    at org.apache.maven.lifecycle.internal.LifecycleModuleBuilder.buildProject (LifecycleModuleBuilder.java:73)
    at org.apache.maven.lifecycle.internal.builder.singlethreaded.SingleThreadedBuilder.build (SingleThreadedBuilder.java:53)
    at org.apache.maven.lifecycle.internal.LifecycleStarter.execute (LifecycleStarter.java:118)
    at org.apache.maven.DefaultMaven.doExecute (DefaultMaven.java:261)
    at org.apache.maven.DefaultMaven.doExecute (DefaultMaven.java:173)
    at org.apache.maven.DefaultMaven.execute (DefaultMaven.java:101)
    at org.apache.maven.cli.MavenCli.execute (MavenCli.java:919)
    at org.apache.maven.cli.MavenCli.doMain (MavenCli.java:285)
    at org.apache.maven.cli.MavenCli.main (MavenCli.java:207)
    at jdk.internal.reflect.DirectMethodHandleAccessor.invoke (DirectMethodHandleAccessor.java:103)
    at java.lang.reflect.Method.invoke (Method.java:580)
    at org.codehaus.plexus.classworlds.launcher.Launcher.launchEnhanced (Launcher.java:255)
    at org.codehaus.plexus.classworlds.launcher.Launcher.launch (Launcher.java:201)
    at org.codehaus.plexus.classworlds.launcher.Launcher.mainWithExitCode (Launcher.java:361)
    at org.codehaus.plexus.classworlds.launcher.Launcher.main (Launcher.java:314)
Caused by: org.apache.maven.plugin.MojoExecutionException: Process terminated with exit code: 1
    at org.springframework.boot.maven.JavaProcessExecutor.run (JavaProcessExecutor.java:74)
    at org.springframework.boot.maven.RunMojo.run (RunMojo.java:76)
    at org.springframework.boot.maven.AbstractRunMojo.run (AbstractRunMojo.java:242)
    at org.springframework.boot.maven.AbstractRunMojo.execute (AbstractRunMojo.java:209)
    at org.apache.maven.plugin.DefaultBuildPluginManager.executeMojo (DefaultBuildPluginManager.java:126)
    at org.apache.maven.lifecycle.internal.MojoExecutor.doExecute2 (MojoExecutor.java:328)
    at org.apache.maven.lifecycle.internal.MojoExecutor.doExecute (MojoExecutor.java:316)
    at org.apache.maven.lifecycle.internal.MojoExecutor.execute (MojoExecutor.java:212)
    at org.apache.maven.lifecycle.internal.MojoExecutor.execute (MojoExecutor.java:174)
    at org.apache.maven.lifecycle.internal.MojoExecutor.access$000 (MojoExecutor.java:75)
    at org.apache.maven.lifecycle.internal.MojoExecutor$1.run (MojoExecutor.java:162)
    at org.apache.maven.plugin.DefaultMojosExecutionStrategy.execute (DefaultMojosExecutionStrategy.java:39)
    at org.apache.maven.lifecycle.internal.MojoExecutor.execute (MojoExecutor.java:159)
    at org.apache.maven.lifecycle.internal.LifecycleModuleBuilder.buildProject (LifecycleModuleBuilder.java:105)
    at org.apache.maven.lifecycle.internal.LifecycleModuleBuilder.buildProject (LifecycleModuleBuilder.java:73)
    at org.apache.maven.lifecycle.internal.builder.singlethreaded.SingleThreadedBuilder.build (SingleThreadedBuilder.java:53)
    at org.apache.maven.lifecycle.internal.LifecycleStarter.execute (LifecycleStarter.java:118)
    at org.apache.maven.DefaultMaven.doExecute (DefaultMaven.java:261)
    at org.apache.maven.DefaultMaven.doExecute (DefaultMaven.java:173)
    at org.apache.maven.DefaultMaven.execute (DefaultMaven.java:101)
    at org.apache.maven.cli.MavenCli.execute (MavenCli.java:919)
    at org.apache.maven.cli.MavenCli.doMain (MavenCli.java:285)
    at org.apache.maven.cli.MavenCli.main (MavenCli.java:207)
    at jdk.internal.reflect.DirectMethodHandleAccessor.invoke (DirectMethodHandleAccessor.java:103)
    at java.lang.reflect.Method.invoke (Method.java:580)
    at org.codehaus.plexus.classworlds.launcher.Launcher.launchEnhanced (Launcher.java:255)
    at org.codehaus.plexus.classworlds.launcher.Launcher.launch (Launcher.java:201)
    at org.codehaus.plexus.classworlds.launcher.Launcher.mainWithExitCode (Launcher.java:361)
    at org.codehaus.plexus.classworlds.launcher.Launcher.main (Launcher.java:314)
[ERROR] 
[ERROR] Re-run Maven using the -X switch to enable full debug logging.
[ERROR] 
[ERROR] For more information about the errors and possible solutions, please read the following articles:
[ERROR] [Help 1] http://cwiki.apache.org/confluence/display/MAVEN/MojoExecutionException
