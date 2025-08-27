import { createLogger } from '../utils/logger.js';

const logger = createLogger('TDDTemplates');

/**
 * 获取TDD模板资源
 */
export async function getTDDTemplates(sessionManager) {
  logger.info('🧪 获取TDD模板资源');
  
  try {
    // TDD各阶段的模板定义
    const templates = {
      phases: {
        red: {
          name: 'RED阶段',
          description: '编写失败的测试',
          principles: [
            '只编写测试代码，不编写生产代码',
            '确保测试失败（因为没有实现）',
            '测试应该清晰地表达需求',
            '一次只测试一个行为'
          ],
          filePatterns: [
            'tests/**/*Test.java',
            'tests/**/*test.js',
            'tests/**/*_test.py',
            '**/*Test.kt',
            '**/*Spec.scala'
          ],
          templates: {
            java: {
              junit5: `
@Test
@DisplayName("{description}")
void should_{behavior}_when_{condition}() {
    // Given
    {given}
    
    // When
    {when}
    
    // Then
    {then}
}`,
              mockito: `
@ExtendWith(MockitoExtension.class)
class {ClassName}Test {
    @Mock
    private {DependencyType} {dependencyName};
    
    @InjectMocks
    private {ClassName} {instanceName};
    
    @Test
    void should_{behavior}_when_{condition}() {
        // Given
        when({dependencyName}.{method}()).thenReturn({expectedValue});
        
        // When
        {ResultType} result = {instanceName}.{methodUnderTest}();
        
        // Then
        assertThat(result).isEqualTo({expectedResult});
    }
}`
            },
            javascript: {
              jest: `
describe('{ComponentName}', () => {
  it('should {behavior} when {condition}', () => {
    // Given
    const {given} = {givenValue};
    
    // When
    const result = {when};
    
    // Then
    expect(result).{assertion};
  });
});`,
              testingLibrary: `
import { render, screen } from '@testing-library/react';
import { {ComponentName} } from './{ComponentName}';

describe('{ComponentName}', () => {
  it('should {behavior} when {condition}', () => {
    // Given
    const props = {props};
    
    // When
    render(<{ComponentName} {...props} />);
    
    // Then
    expect(screen.getByText('{expectedText}')).toBeInTheDocument();
  });
});`
            }
          }
        },
        
        green: {
          name: 'GREEN阶段',
          description: '编写最少代码使测试通过',
          principles: [
            '只编写生产代码，不编写测试代码',
            '编写最少的代码使测试通过',
            '不考虑代码质量，只关注功能实现',
            '快速让测试变绿'
          ],
          filePatterns: [
            'src/main/**/*.java',
            'src/**/*.js',
            'lib/**/*.py',
            'src/main/**/*.kt',
            'src/main/**/*.scala'
          ],
          templates: {
            java: {
              service: `
@Service
public class {ClassName} {
    
    private final {DependencyType} {dependencyName};
    
    public {ClassName}({DependencyType} {dependencyName}) {
        this.{dependencyName} = {dependencyName};
    }
    
    public {ReturnType} {methodName}({ParameterType} {parameterName}) {
        // TODO: 实现最小功能使测试通过
        return {defaultReturnValue};
    }
}`,
              controller: `
@RestController
@RequestMapping("/{basePath}")
public class {ClassName}Controller {
    
    private final {ServiceType} {serviceName};
    
    public {ClassName}Controller({ServiceType} {serviceName}) {
        this.{serviceName} = {serviceName};
    }
    
    @GetMapping("/{endpoint}")
    public ResponseEntity<{ResponseType}> {methodName}() {
        // TODO: 实现最小功能使测试通过
        return ResponseEntity.ok({defaultResponse});
    }
}`
            },
            javascript: {
              function: `
function {functionName}({parameters}) {
  // TODO: 实现最小功能使测试通过
  return {defaultReturnValue};
}

export { {functionName} };`,
              class: `
class {ClassName} {
  constructor({constructorParams}) {
    {constructorAssignments}
  }
  
  {methodName}({parameters}) {
    // TODO: 实现最小功能使测试通过
    return {defaultReturnValue};
  }
}

export { {ClassName} };`,
              component: `
import React from 'react';

export function {ComponentName}({props}) {
  // TODO: 实现最小功能使测试通过
  return (
    <div>
      {basicImplementation}
    </div>
  );
}`
            }
          }
        },
        
        refactor: {
          name: 'REFACTOR阶段',
          description: '重构代码提高质量',
          principles: [
            '保持测试通过',
            '改进代码结构和可读性',
            '消除重复代码',
            '应用设计模式',
            '优化性能'
          ],
          patterns: [
            'Extract Method',
            'Extract Class',
            'Move Method',
            'Rename Method',
            'Replace Magic Number with Symbolic Constant',
            'Replace Conditional with Polymorphism'
          ],
          checklist: [
            '代码重复是否已消除？',
            '方法长度是否合理？',
            '变量和方法命名是否清晰？',
            '类的职责是否单一？',
            '依赖是否合理？',
            '异常处理是否完善？',
            '性能是否可以优化？'
          ]
        }
      },
      
      workflows: {
        feature: {
          name: '特性开发工作流',
          steps: [
            {
              phase: 'PRD',
              description: '编写产品需求文档',
              outputs: ['docs/prd/{featureId}.prd.md']
            },
            {
              phase: 'ANALYSIS',
              description: '分析需求和技术设计',
              outputs: ['docs/analysis/{featureId}.requirements.json', 'docs/design/{featureId}.design.md']
            },
            {
              phase: 'CASES',
              description: '生成测试用例',
              outputs: ['tests/specs/{featureId}.cases.yaml']
            },
            {
              phase: 'RED',
              description: '编写失败测试',
              outputs: ['tests/**/*Test.*']
            },
            {
              phase: 'GREEN',
              description: '最小实现',
              outputs: ['src/**/*.*']
            },
            {
              phase: 'REFACTOR',
              description: '重构优化',
              outputs: ['src/**/*.*', 'tests/**/*Test.*']
            }
          ]
        }
      }
    };
    
    const result = {
      metadata: {
        version: '2.0',
        lastUpdated: new Date().toISOString(),
        description: 'TDD开发过程中各个阶段的代码模板和工作流程'
      },
      templates,
      usage: {
        description: 'TDD模板用于指导开发过程中的各个阶段',
        examples: [
          'RED阶段使用测试模板编写失败测试',
          'GREEN阶段使用生产代码模板最小实现',
          'REFACTOR阶段参考重构清单优化代码'
        ]
      }
    };
    
    logger.info('✅ TDD模板资源获取完成');
    return result;
    
  } catch (error) {
    logger.error('获取TDD模板失败:', error);
    throw error;
  }
}