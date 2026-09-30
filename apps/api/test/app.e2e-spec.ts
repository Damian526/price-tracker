import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('TrackersController (e2e)', () => {
  let app: INestApplication;

  // Runs once before all tests: starts the server
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule], // Loads your entire real app
    }).compile();

    app = moduleFixture.createNestApplication();
    // Must include the same global pipes used in main.ts so DTOs work
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    // The RMQ client connects lazily; connect now so close() doesn't race channel setup
    await app.get<ClientProxy>('SCRAPE_SERVICE').connect();
  });

  // Runs after all tests: shuts down the server
  afterAll(async () => {
    await app.close();
  });

  it('POST /trackers - should reject invalid data (DTO Validation)', () => {
    return request(app.getHttpServer())
      .post('/trackers')
      .send({ url: 'not-a-url', targetPrice: -50 }) // Invalid data
      .expect(400) // Expect a 400 Bad Request error
      .expect((res) => {
        expect(res.body.message).toContain('Must be a valid URL');
      });
  });

  it('POST /trackers - should successfully create a tracker', () => {
    return request(app.getHttpServer())
      .post('/trackers')
      .send({ url: 'https://allegro.pl/oferta/123', targetPrice: 150 })
      .expect(201) // 201 Created
      .expect((res) => {
        // Assert the database actually returned a saved document
        expect(res.body).toHaveProperty('_id');
        expect(res.body.store).toBe('allegro.pl');
        expect(res.body.targetPrice).toBe(150);
      });
  });
});
