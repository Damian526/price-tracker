import { Injectable } from '@nestjs/common';
import { StoreParser } from './store-parser.inteface';
import { XkomParser } from './XkomParser';
import { MoreleParser } from './MoreleParser';

@Injectable()
export class ParserRegistry {
  private readonly parsers: StoreParser[] = [
    new XkomParser(),
    new MoreleParser(),
  ];

  getParserForUrl(url: string): StoreParser {
    const parser = this.parsers.find((p) => p.matches(url));
    if (!parser) {
      throw new Error(`No registered store parser found for URL: ${url}`);
    }
    return parser;
  }
  getAllParsers(): StoreParser[] {
    return this.parsers;
  }
}
