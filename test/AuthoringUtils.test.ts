/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import * as assert from 'assert';
import { AuthoringUtils } from '../src/AuthoringUtils';
import Constants, { AEM_MODE, TAG_TYPE, TAG_ATTR } from '../src/Constants';
import { PathUtils } from '../src/PathUtils';

describe('AuthoringUtils ->', () => {
    const authoringUtils = new AuthoringUtils('http://www.abc.com');

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return authoring clientlibs', () => {
        // given
        const expected = [
            'http://www.abc.com/etc.clientlibs/cq/gui/components/authoring/editors/clientlibs/internal/page.js',
            'http://www.abc.com/etc.clientlibs/cq/gui/components/authoring/editors/clientlibs/internal/page.css',
            'http://www.abc.com/etc.clientlibs/cq/gui/components/authoring/editors/clientlibs/internal/pagemodel/messaging.js',
            'http://www.abc.com/etc.clientlibs/cq/gui/components/authoring/editors/clientlibs/internal/messaging.js'
        ];

        // when
        const actual = authoringUtils.generateClientLibUrls();

        // then
        assert.deepStrictEqual(actual, expected);
    });

    it('should return empty array if domain is not provided', () => {
        // given
        jest.spyOn(authoringUtils, 'getApiDomain').mockReturnValue(null);

        // when
        const actual = authoringUtils.generateClientLibUrls();

        // then
        assert.deepStrictEqual(actual, []);
    });

    describe('generateElementString', () => {
        let generateElementStringSpy: jest.SpyInstance<any, unknown[]>;

        const mockParameters = (tagType: string, attr: string, attrValue: string) => {
            // given
             generateElementStringSpy = jest.spyOn(AuthoringUtils.prototype as any, 'generateElementString')
                .mockImplementationOnce(() => generateElementStringSpy.getMockImplementation()(tagType, attr, attrValue));

            jest.spyOn(authoringUtils, 'generateClientLibUrls').mockReturnValue([ 'http://foo/dummy-request.js' ]);

            // when
            authoringUtils.getTagsForState(Constants.STATE_AUTHORING);
        };

        it('should not generate any element if requested for empty tag name', () => {
            // given and when
            mockParameters('', 'src', 'foo');

            // then
            expect(generateElementStringSpy).toHaveReturnedWith('');
        });

        it('should not generate any element if requested for unsupported tag name', () => {
            // given and when
            mockParameters('', 'src', 'foo');

            // then
            expect(generateElementStringSpy).toHaveReturnedWith('');
        });

        it('should generate element markup if requested for supported tag type (script)', () => {
            // given and when
            mockParameters(TAG_TYPE.JS, TAG_ATTR.SRC, 'foo.bar');

            // then
            expect(generateElementStringSpy).toHaveReturnedWith(`<script src="foo.bar"></script>`);
        });

        it('should generate element markup if requested for supported tag type (stylesheet)', () => {
            // given and when
            mockParameters(TAG_TYPE.STYLESHEET, TAG_ATTR.HREF, 'foo.bar');

            // then
            expect(generateElementStringSpy).toHaveReturnedWith(`<link href="foo.bar"/>`);
        });
    });

    describe('getTagsForState', () => {
        it('should return html tags if in authoring mode', () => {
            // given
            const clientLibUrls = [ 'http://foo/test.js', 'http://foo/test.css' ];
            const expected = '<script src="http://foo/test.js"></script><link href="http://foo/test.css"/>';

            jest.spyOn(authoringUtils, 'generateClientLibUrls').mockReturnValue(clientLibUrls);

            // when
            const actual = authoringUtils.getTagsForState(Constants.STATE_AUTHORING);

            // then
            assert.strictEqual(actual, expected);
        });

        it('should return empty string if not in authoring mode', () => {
            // when
            const actual = authoringUtils.getTagsForState('foobar');

            // then
            assert.strictEqual(actual, '');
        });

        it('should return empty string if unsupported resources were returned by `generateClientLibUrls`', () => {
            // given
            const clientLibUrls = [ 'http://foo/test.exe', 'http://foo/test.bat' ];

            jest.spyOn(authoringUtils, 'generateClientLibUrls').mockReturnValue(clientLibUrls);

            // when
            const actual = authoringUtils.getTagsForState(Constants.STATE_AUTHORING);

            // then
            assert.strictEqual(actual, '');
        });
    });

    describe('getAemMode', () => {
        it('should return `aemmode` query parameter (preview)', () => {
            // given
            const actual = AEM_MODE.PREVIEW;

            // when
            jest.spyOn(PathUtils, 'getCurrentURL').mockReturnValue(`http://www.abc.com?aemmode=${actual}`);

            // then
            assert.strictEqual(AuthoringUtils.getAemMode(), actual);
        });

        it('should return `aemmode` query parameter (edit)', () => {
            // given
            const actual = AEM_MODE.EDIT;

            // when
            jest.spyOn(PathUtils, 'getCurrentURL').mockReturnValue(`http://www.abc.com?aemmode=${actual}`);

            // then
            assert.strictEqual(AuthoringUtils.getAemMode(), actual);
        });

        it('should return `null` if `aemmode` parameter is not provided', () => {
            // when
            jest.spyOn(PathUtils, 'getCurrentURL').mockReturnValue(`http://www.abc.com`);

            // then
            assert.strictEqual(AuthoringUtils.getAemMode(), null);
        });

        it('should return `null` if URL is malformed', () => {
            // when
            jest.spyOn(PathUtils, 'getCurrentURL').mockReturnValue(`foobar`);

            // then
            assert.strictEqual(AuthoringUtils.getAemMode(), null);
        });
    });

    describe('isStateActive', () => {
        describe('data from meta properties', () => {
            it('should return `false` if: not in authoring mode and `aemmode` is `preview`', () => {
                // given
                jest.spyOn(PathUtils, 'getMetaPropertyValue').mockReturnValue(AEM_MODE.PREVIEW);
                jest.spyOn(AuthoringUtils, 'getAemMode').mockReturnValue(null);

                // then
                assert.strictEqual(AuthoringUtils.isStateActive('foo'), false);
            });

            it('should return `false` if: not in authoring mode and `aemmode` is `edit`', () => {
                // given
                jest.spyOn(PathUtils, 'getMetaPropertyValue').mockReturnValue(AEM_MODE.EDIT);
                jest.spyOn(AuthoringUtils, 'getAemMode').mockReturnValue(null);

                // then
                assert.strictEqual(AuthoringUtils.isStateActive('foo'), false);
            });

            it('should return `false` if: in authoring mode and `aemmode` is `preview`', () => {
                // given
                jest.spyOn(PathUtils, 'getMetaPropertyValue').mockReturnValue(AEM_MODE.PREVIEW);
                jest.spyOn(AuthoringUtils, 'getAemMode').mockReturnValue(null);

                // then
                assert.strictEqual(AuthoringUtils.isStateActive(Constants.STATE_AUTHORING), false);
            });

            it('should return `false` if: in authoring mode and `aemmode` is anything (except: edit)', () => {
                // given
                jest.spyOn(PathUtils, 'getMetaPropertyValue').mockReturnValue('foo');
                jest.spyOn(AuthoringUtils, 'getAemMode').mockReturnValue(null);

                // then
                assert.strictEqual(AuthoringUtils.isStateActive(Constants.STATE_AUTHORING), false);
            });

            it('should return `true`: if in authoring mode and `aemmode` is `edit`', () => {
                // given
                jest.spyOn(PathUtils, 'getMetaPropertyValue').mockReturnValue(AEM_MODE.EDIT);
                jest.spyOn(AuthoringUtils, 'getAemMode').mockReturnValue(null);

                // then
                assert.strictEqual(AuthoringUtils.isStateActive(Constants.STATE_AUTHORING), true);
            });
        });

        describe('data from query parameter', () => {
            it('should return `false` if: not in authoring mode and `aemmode` is `preview`', () => {
                // given
                jest.spyOn(PathUtils, 'getMetaPropertyValue').mockReturnValue(null);
                jest.spyOn(AuthoringUtils, 'getAemMode').mockReturnValue(AEM_MODE.PREVIEW);

                // then
                assert.strictEqual(AuthoringUtils.isStateActive('foo'), false);
            });

            it('should return `false` if: not in authoring mode and `aemmode` is `edit`', () => {
                // given
                jest.spyOn(PathUtils, 'getMetaPropertyValue').mockReturnValue(null);
                jest.spyOn(AuthoringUtils, 'getAemMode').mockReturnValue(AEM_MODE.EDIT);

                // then
                assert.strictEqual(AuthoringUtils.isStateActive('foo'), false);
            });

            it('should return `false` if: in authoring mode and `aemmode` is `preview`', () => {
                // given
                jest.spyOn(AuthoringUtils, 'getAemMode').mockReturnValue(AEM_MODE.PREVIEW);
                jest.spyOn(PathUtils, 'getMetaPropertyValue').mockReturnValue(null);

                // then
                assert.strictEqual(AuthoringUtils.isStateActive(Constants.STATE_AUTHORING), false);
            });

            it('should return `false` if: in authoring mode and `aemmode` is anything (except: edit)', () => {
                // given
                jest.spyOn(AuthoringUtils, 'getAemMode').mockReturnValue('foo');
                jest.spyOn(PathUtils, 'getMetaPropertyValue').mockReturnValue(null);

                // then
                assert.strictEqual(AuthoringUtils.isStateActive(Constants.STATE_AUTHORING), false);
            });

            it('should return `true`: if in authoring mode and `aemmode` is `edit`', () => {
                // given
                jest.spyOn(AuthoringUtils, 'getAemMode').mockReturnValue(AEM_MODE.EDIT);
                jest.spyOn(PathUtils, 'getMetaPropertyValue').mockReturnValue(null);

                // then
                assert.strictEqual(AuthoringUtils.isStateActive(Constants.STATE_AUTHORING), true);
            });
        });

        describe('data from meta property and query parameter', () => {
            it('should return `false` if: not in authoring mode and `aemmode` is `preview` (query parameter and meta property)', () => {
                // given
                jest.spyOn(PathUtils, 'getMetaPropertyValue').mockReturnValue(AEM_MODE.PREVIEW);
                jest.spyOn(AuthoringUtils, 'getAemMode').mockReturnValue(AEM_MODE.PREVIEW);

                // then
                assert.strictEqual(AuthoringUtils.isStateActive('foo'), false);
            });

            it('should return `false` if: not in authoring mode and `aemmode` is `edit` (query parameter and meta property)', () => {
                // given
                jest.spyOn(PathUtils, 'getMetaPropertyValue').mockReturnValue(AEM_MODE.EDIT);
                jest.spyOn(AuthoringUtils, 'getAemMode').mockReturnValue(AEM_MODE.EDIT);

                // then
                assert.strictEqual(AuthoringUtils.isStateActive('foo'), false);
            });

            it('should return `true` if: in authoring mode and `aemmode` is `preview` (query parameter) and `edit` (meta property)', () => {
                // given
                jest.spyOn(AuthoringUtils, 'getAemMode').mockReturnValue(AEM_MODE.PREVIEW);
                jest.spyOn(PathUtils, 'getMetaPropertyValue').mockReturnValue(AEM_MODE.EDIT);

                // then
                assert.strictEqual(AuthoringUtils.isStateActive(Constants.STATE_AUTHORING), true);
            });

            it('should return `true` if: in authoring mode and `aemmode` is `edit` (query parameter) and `preview` (meta property)', () => {
                // given
                jest.spyOn(AuthoringUtils, 'getAemMode').mockReturnValue(AEM_MODE.EDIT);
                jest.spyOn(PathUtils, 'getMetaPropertyValue').mockReturnValue(AEM_MODE.PREVIEW);

                // then
                assert.strictEqual(AuthoringUtils.isStateActive(Constants.STATE_AUTHORING), true);
            });

            it('should return `false`: if in authoring mode and `aemmode` is anything (query parameter) and anything (meta property)', () => {
                // given
                jest.spyOn(AuthoringUtils, 'getAemMode').mockReturnValue('foo');
                jest.spyOn(PathUtils, 'getMetaPropertyValue').mockReturnValue('foo');

                // then
                assert.strictEqual(AuthoringUtils.isStateActive(Constants.STATE_AUTHORING), false);
            });
        });
    });
});
