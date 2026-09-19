// Runs before every test file.
//
// jsdom has no canvas: `getContext()` returns null and logs "Not implemented" through the virtual
// console. StarField already handles a null context by drawing nothing, so the stub only removes
// the noise; `star-field.test.ts` still spies on the same method to hand in a fake context.
import { vi } from 'vitest';

vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => null);
