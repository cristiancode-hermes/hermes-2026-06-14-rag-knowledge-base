import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from '../documents/document.entity';
import { Chunk } from '../chunks/chunk.entity';
import { RagService } from '../rag/rag.service';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(Chunk)
    private readonly chunkRepository: Repository<Chunk>,
    private readonly ragService: RagService,
  ) {}

  async seed(): Promise<{ message: string; documentCount: number; chunkCount: number }> {
    // Check if data already seeded
    const existingCount = await this.documentRepository.count();
    if (existingCount > 0) {
      // Clear existing data first
      await this.chunkRepository.delete({});
      await this.documentRepository.delete({});
    }

    const documents = [
      {
        id: crypto.randomUUID(),
        title: 'Angular Signals and Change Detection',
        content: `Angular Signals represent a revolutionary shift in how Angular handles reactivity and change detection. Introduced in Angular 16 as a developer preview and stabilized in Angular 17, Signals provide a new primitive for managing state changes in Angular applications.

At its core, a Signal is a wrapper around a value that notifies consumers when the value changes. Unlike the traditional zone.js-based change detection which would check the entire component tree for changes, Signals enable granular, push-based reactivity. This means only the components that actually depend on a changed value will be re-rendered, leading to significant performance improvements in complex applications.

The Signal API is deceptively simple. You create a signal using the signal() function: const count = signal(0). To read the value, you call count(). To update it, you use count.set(5) or count.update(v => v + 1). The magic happens with computed signals, which derive values from other signals: const doubled = computed(() => count() * 2). Computed signals are lazily evaluated and cached, recalculating only when their dependencies change.

Effects are another crucial concept: effect(() => console.log('Count:', count())). Effects run whenever their signal dependencies change and are automatically cleaned up when the component is destroyed. This makes them perfect for side effects like logging, persisting data, or triggering imperative operations.

One of the most powerful aspects of Signals is the mental model they provide. Instead of thinking about data flowing through component trees and relying on Angular's change detection cycle, developers can think in terms of reactive data graphs. This aligns more closely with modern reactive programming patterns and makes the code more predictable and testable.

The integration with Angular's existing systems is seamless. Signals work with the async pipe, can be used in template expressions, and interoperate with RxJS through functions like toObservable() and fromObservable(). This allows teams to incrementally adopt Signals alongside their existing RxJS-based architectures.

For change detection, Angular now offers the signal-based change detection strategy. When components use OnPush strategy and bind to signals in their templates, Angular can precisely track which components depend on which signals. When a signal changes, only the affected components are marked for check, and during the next change detection cycle, only those components are re-rendered.

This represents a fundamental improvement over zone.js-based change detection. In traditional Angular, any asynchronous operation (setTimeout, Promise, XHR callback) triggers a full application change detection. With Signals, only the parts of the UI that are actually affected by a state change will update. For large applications with hundreds of components, this can dramatically reduce the number of change detection cycles and improve rendering performance.

The Angular team has designed Signals to be framework-agnostic as well. The signal() function and the computed() and effect() APIs work outside of Angular entirely, meaning you can use them in plain TypeScript applications or even in Node.js environments. This makes them a universal reactive primitive, not just an Angular-specific concept.

Looking ahead, Angular's future iterations will likely build on Signals as the foundation for a completely zone-less architecture. The goal is to eventually make zone.js optional, allowing Angular applications to be more portable and performant, especially in non-browser environments like Web Workers or server-side rendering contexts.

In conclusion, Angular Signals represent a major architectural evolution for the framework. They bring modern reactive programming patterns to Angular while maintaining backward compatibility and enabling significant performance improvements.`,
        source: 'paste',
      },
      {
        id: crypto.randomUUID(),
        title: 'NestJS Architecture Patterns',
        content: `NestJS has emerged as one of the most popular Node.js frameworks for building enterprise-grade server-side applications. Its architecture draws heavy inspiration from Angular, utilizing a modular structure, dependency injection, decorators, and a layered architecture that promotes separation of concerns.

The fundamental building block in NestJS is the Module. Every NestJS application must have at least one root module that serves as the entry point. Modules are decorated with @Module() and can contain controllers (route handlers), providers (services), imports (other modules), and exports (shared providers). This modular architecture makes it easy to organize code into feature-based or domain-based modules, each with its own cohesive set of responsibilities.

Controllers are responsible for handling incoming HTTP requests and returning responses. They are decorated with @Controller() and use method decorators like @Get(), @Post(), @Put(), and @Delete() to define route handlers. Controllers should be thin—they should only handle request/response concerns and delegate business logic to services.

Services (providers) contain the business logic of the application. They are injectable classes decorated with @Injectable() that can be injected into controllers or other services through NestJS's powerful dependency injection system. The DI container manages the lifecycle of providers and handles their instantiation and wiring automatically.

NestJS supports several architectural patterns through its providers:

1. Singleton providers (default): A single instance is shared across the entire application. This is ideal for services that maintain state or caches.

2. Request-scoped providers: A new instance is created for each incoming request. This is useful for request-specific state or multi-tenant applications.

3. Transient providers: A new instance is created each time a provider is injected. This is used when each consumer needs its own isolated instance.

The framework also provides robust support for middleware, guards, interceptors, pipes, and exception filters. These cross-cutting concerns can be applied at various levels (global, module, controller, or route handler), giving developers fine-grained control over request processing.

Guards are used for authentication and authorization. They run before route handlers and determine whether a request should be processed. Guards have access to the ExecutionContext and can read request metadata, making them perfect for role-based access control.

Interceptors wrap around route handlers and can transform the result or extend the behavior before and after handler execution. They are commonly used for logging, caching, serialization, and wrapping responses in standardized formats.

Pipes transform input data or validate it. NestJS ships with built-in pipes like ValidationPipe (which uses class-validator), ParseIntPipe, and ParseUUIDPipe. Custom pipes can be created for domain-specific validation or transformation logic.

Exception filters handle uncaught exceptions thrown during request processing. They can catch specific exception types and transform them into appropriate HTTP responses. A global exception filter ensures consistent error formatting across the entire application.

For data access, NestJS integrates seamlessly with TypeORM, Prisma, Mongoose, and other ORMs through dedicated modules. The @nestjs/typeorm package provides TypeOrmModule.forRoot() for configuration and TypeOrmModule.forFeature() for injecting repositories into feature modules.

NestJS also excels at building microservices architectures. It supports multiple transport layers including TCP, Redis, RabbitMQ, Kafka, and gRPC. The same decorator-based programming model applies to microservices, making it easy to build hybrid applications that combine HTTP APIs with event-driven microservices.

Testing is another area where NestJS shines. The framework provides TestingModule for unit and integration testing, with utilities for mocking providers and controlling the DI container. This allows developers to test controllers, services, and guards in isolation or as part of an integrated test suite.`,
        source: 'paste',
      },
      {
        id: crypto.randomUUID(),
        title: 'Neon PostgreSQL and pgvector',
        content: `Neon is a serverless PostgreSQL platform that separates compute from storage, enabling features like instant branching, point-in-time recovery, and auto-scaling to zero. Unlike traditional PostgreSQL deployments that bind compute and storage together, Neon's architecture allows databases to scale down to zero when not in use and scale up instantly when traffic arrives.

At the heart of Neon's architecture is the separation of the SQL query processing layer (compute) from the data storage layer. The compute layer contains the PostgreSQL engine that handles connections and executes queries, while the storage layer manages data persistence using a custom-designed page server. This decoupling means compute instances can be created, destroyed, and scaled independently of the underlying storage.

One of Neon's standout features is database branching. Inspired by Git, branching allows developers to create instant, writable copies of their database at any point in time. This is incredibly valuable for development workflows: developers can create a branch of their production database, test migrations or schema changes safely, and then merge or discard the branch when done. Branching is nearly instantaneous because it uses copy-on-write semantics, storing only the differences between branches.

For RAG (Retrieval-Augmented Generation) applications, Neon's support for pgvector is particularly important. pgvector is a PostgreSQL extension that adds vector similarity search capabilities to the database. It allows you to store vector embeddings alongside your relational data and perform efficient similarity searches using various distance metrics.

Installing pgvector in Neon is straightforward: just run CREATE EXTENSION vector; in your database. The extension introduces a new data type called "vector" that can store embeddings of any dimension. You can create tables with vector columns and add indexes for efficient similarity search.

The key SQL features of pgvector include:

1. Vector data type: CREATE TABLE items (id bigserial, embedding vector(1536));
2. Distance operators: <-> (L2 distance), <#> (inner product), <=> (cosine distance)
3. Index support: IVFFlat and HNSW indexes for approximate nearest neighbor search
4. Similarity search queries: SELECT * FROM items ORDER BY embedding <-> '[0.1, 0.2, ...]' LIMIT 5;

For RAG workflows, the typical pattern involves: chunking documents, generating embeddings using an embedding model (like OpenAI's text-embedding-ada-002 or open-source alternatives like BGE or Sentence Transformers), storing the embeddings in pgvector, and then querying for similar chunks when a user asks a question.

Neon's serverless nature complements RAG architectures perfectly. Since RAG applications may have variable usage patterns (sometimes idle, sometimes bursty), Neon's ability to scale to zero and instantly resume saves costs while maintaining responsiveness. When a new query arrives at an idle database, Neon can warm up a compute node in under a second.

The combination of Neon and pgvector creates a powerful stack for AI applications. Instead of maintaining a separate vector database alongside PostgreSQL, developers can keep all their data in a single database, simplifying their architecture and reducing operational complexity. This unified approach means that relational queries, full-text search, and vector similarity search can all be performed in the same transaction, with the same consistency guarantees.

Neon also provides a branching workflow that's particularly useful for AI/ML development. Data scientists and ML engineers can branch the database to experiment with different embedding strategies, chunking algorithms, or similarity thresholds without affecting the production system. Once validated, the changes can be merged or the branch can be promoted to production.

Performance considerations with pgvector include choosing the right index type: IVFFlat provides faster index creation but slower queries, while HNSW provides faster queries at the cost of slower index building and more memory. For production RAG applications with millions of vectors, proper indexing is crucial for maintaining sub-second query times.`,
        source: 'paste',
      },
      {
        id: crypto.randomUUID(),
        title: 'TypeScript Advanced Types',
        content: `TypeScript's type system is one of the most powerful features of the language, offering a rich set of advanced types that enable developers to write safer, more expressive code. Understanding these advanced types is crucial for building robust applications and creating reusable type utilities.

Union types and intersection types form the foundation of TypeScript's type composition. Union types (A | B) represent values that can be either type A or type B, while intersection types (A & B) represent values that satisfy both types simultaneously. These combinators are essential for modeling complex domain concepts.

Discriminated unions are a powerful pattern where a literal type property (the discriminant) is used to narrow union types. For example: type Shape = | { kind: 'circle'; radius: number } | { kind: 'rectangle'; width: number; height: number }. TypeScript can narrow the union based on the discriminant property, providing type-safe access to the associated data in each variant.

Mapped types allow you to transform existing types by iterating over their properties. The syntax { [K in keyof T]: SomeTransform<T[K]> } creates a new type with each property of T transformed. Common mapped types include Partial<T> (makes all properties optional), Required<T> (makes all properties required), Readonly<T> (makes all properties readonly), and Pick<T, K> (selects only specific properties).

Template literal types, introduced in TypeScript 4.1, enable manipulation of string literal types using template literal syntax. You can create types like type EventName = \`on\${Capitalize<string>}\` to model event handler names, or use conditional checks with the infer keyword to extract parts of string patterns. This is particularly powerful for building type-safe API clients and event systems.

Conditional types use the syntax T extends U ? X : Y to create types that depend on other types. Combined with the infer keyword, they can unwrap or extract types from complex constructs. For example, type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never extracts the return type of a function type.

The infer keyword is especially useful in conditional types for pattern matching against complex types. It can extract types from promises (type Await<T> = T extends Promise<infer U> ? U : T), array elements (type Element<T> = T extends (infer U)[] ? U : never), or function parameters.

Recursive types, supported since TypeScript 4.1 with improved support in later versions, allow types to reference themselves. This is essential for modeling nested structures like JSON (type JSONValue = string | number | boolean | null | JSONValue[] | { [k: string]: JSONValue }) or deeply nested configurations.

The satisfies operator, introduced in TypeScript 4.9, allows you to verify that a value's type satisfies a constraint while keeping the most specific inferred type. This is useful when you want type checking without widening: const config = { port: 3000, host: 'localhost' } satisfies Record<string, string | number>.

Variadic tuple types, introduced in TypeScript 4.0, allow tuples to use spread operators with generics. This enables typing of functions with variable arguments in a type-safe manner. For example, type Tuple<T, N extends number> = N extends N ? number extends N ? T[] : _TupleOf<T, N, []> : never.

The as const assertion converts an entire object or array to deeply readonly literal types. This is invaluable for defining constants and enums with precise literal types instead of widened string/number types. For example, const COLORS = { RED: '#ff0000', GREEN: '#00ff00' } as const makes each property's type the literal string value.

Branded types (or nominal typing) use intersection types to create unique type identities even when the underlying types are the same. type UserId = string & { readonly __brand: 'UserId' } creates a branded type that prevents accidentally passing a regular string where a UserId is expected.

These advanced type features, when combined, enable building sophisticated type-safe abstractions like option/maybe types, state machines encoded in the type system, type-safe database query builders, and fully typed API clients. Mastering these patterns significantly reduces runtime errors by catching them at compile time and makes code more self-documenting and maintainable.`,
        source: 'paste',
      },
      {
        id: crypto.randomUUID(),
        title: 'Machine Learning Basics',
        content: `Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. At its core, machine learning involves algorithms that build mathematical models from sample data, known as training data, in order to make predictions or decisions without being specifically programmed to perform the task.

The three main categories of machine learning are supervised learning, unsupervised learning, and reinforcement learning. Supervised learning uses labeled training data where each example is paired with an output label. The algorithm learns to map inputs to outputs and can then predict labels for new, unseen data. Common supervised learning tasks include classification (predicting categories) and regression (predicting continuous values).

Unsupervised learning, on the other hand, works with unlabeled data. The algorithm must find patterns, structures, or groupings in the data without any guidance. Common unsupervised learning tasks include clustering (grouping similar data points), dimensionality reduction (reducing the number of features while preserving essential information), and anomaly detection (identifying unusual data points).

Reinforcement learning involves an agent learning to make decisions by interacting with an environment. The agent receives rewards or penalties for its actions and learns to maximize cumulative reward over time. This approach has achieved remarkable results in game playing (AlphaGo, Dota 2), robotics, and autonomous driving.

Feature engineering is a critical step in the machine learning pipeline. Features are individual measurable properties or characteristics of the data being observed. Good features make the learning task easier and lead to better model performance. Common feature engineering techniques include normalization (scaling features to a common range), encoding categorical variables (converting text categories to numbers), and creating interaction features (combining existing features).

The bias-variance tradeoff is a fundamental concept in machine learning. Bias refers to the error introduced by approximating a real-world problem with a simplified model. High bias can cause underfitting, where the model fails to capture important patterns in the data. Variance refers to the model's sensitivity to small fluctuations in the training data. High variance can cause overfitting, where the model learns noise in the training data and performs poorly on new data.

Cross-validation is a technique for assessing how well a model generalizes to new data. The most common form is k-fold cross-validation, where the training data is split into k subsets, the model is trained on k-1 subsets, and evaluated on the held-out subset. This process is repeated k times, and the results are averaged. Cross-validation provides a more robust estimate of model performance than a single train-test split.

Ensemble methods combine multiple machine learning models to produce better results than any single model. Random Forests combine many decision trees, each trained on a random subset of the data. Gradient boosting builds trees sequentially, where each new tree corrects the errors of the previous ones. These methods are among the most powerful techniques for tabular data.

Deep learning is a subset of machine learning that uses neural networks with multiple layers (deep neural networks). These models can learn hierarchical representations of data, with lower layers learning simple features and higher layers learning increasingly abstract concepts. Deep learning has revolutionized computer vision, natural language processing, speech recognition, and many other fields.

Neural networks consist of layers of interconnected nodes (neurons), each performing a simple mathematical operation. The network learns by adjusting the weights of these connections through a process called backpropagation, which computes the gradient of the loss function with respect to each weight and updates the weights to minimize the loss.

Evaluation metrics are essential for measuring model performance. For classification tasks, common metrics include accuracy (fraction of correct predictions), precision (fraction of positive predictions that are correct), recall (fraction of actual positives that are identified correctly), and F1 score (harmonic mean of precision and recall). For regression tasks, mean squared error (MSE) and mean absolute error (MAE) are commonly used.

Machine learning operations (MLOps) is the practice of applying DevOps principles to machine learning workflows. It includes version control for data and models, automated training and deployment pipelines, model monitoring, and reproducibility. MLOps ensures that machine learning projects are reliable, scalable, and maintainable in production environments.`,
        source: 'paste',
      },
    ];

    // Save documents
    const savedDocuments = await this.documentRepository.save(documents);
    this.logger.log(`Seeded ${savedDocuments.length} documents`);

    // Chunk all documents and compute embeddings
    let totalChunks = 0;
    for (const doc of savedDocuments) {
      // Split document into words
      const words = doc.content.split(/\s+/).filter((w) => w.length > 0);
      const chunkSize = 500;
      const overlap = 50;
      const chunks: Chunk[] = [];

      let index = 0;
      let start = 0;

      while (start < words.length) {
        const end = Math.min(start + chunkSize, words.length);
        const chunkWords = words.slice(start, end);
        const content = chunkWords.join(' ');

        const chunk = this.chunkRepository.create({
          id: crypto.randomUUID(),
          documentId: doc.id,
          content,
          chunkIndex: index,
          tokenCount: chunkWords.length,
        });

        chunks.push(chunk);
        index++;

        if (end >= words.length) break;
        start = end - overlap;
      }

      const savedChunks = await this.chunkRepository.save(chunks);
      totalChunks += savedChunks.length;

      // Compute embeddings for each chunk
      for (const chunk of savedChunks) {
        const embedding = this.ragService.embedText(chunk.content);
        await this.chunkRepository.update(chunk.id, {
          embedding: JSON.stringify(embedding),
        });
      }

      this.logger.log(
        `Chunked document "${doc.title}" into ${savedChunks.length} chunks with embeddings`,
      );
    }

    this.logger.log(`Total chunks created: ${totalChunks}`);

    return {
      message: 'Database seeded successfully',
      documentCount: savedDocuments.length,
      chunkCount: totalChunks,
    };
  }
}
