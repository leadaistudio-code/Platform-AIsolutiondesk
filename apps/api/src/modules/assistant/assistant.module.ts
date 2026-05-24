import { Module } from '@nestjs/common';
import { RagService } from './rag.service';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { AssistantService } from './assistant.service';
import { AssistantController } from './assistant.controller';

/**
 * The AI Employee Assistant: document ingestion (RAG) + question answering.
 */
@Module({
  controllers: [DocumentsController, AssistantController],
  providers: [RagService, DocumentsService, AssistantService],
})
export class AssistantModule {}
