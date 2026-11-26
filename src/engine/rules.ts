import type { Config, Group, Rule } from "../types/menu";

export type Violation = {
  id: string; // group id or rule id
  message: string;
};

// Checks a configuration and returns every problem, not only the first one.
export function validate(config: Config, groups: Group[], rules: Rule[]): Violation[] {
  return [
    ...groups.flatMap((group) => checkGroup(config, group, groups, rules)),
    ...rules.flatMap((rule) => checkRule(config, rule, groups)),
  ];
}

function quantity(config: Config, optionId: string) {
  return config[optionId] ?? 0;
}

function optionName(groups: Group[], optionId: string) {
  const option = groups.flatMap((g) => g.options).find((o) => o.id === optionId);
  return option?.name ?? optionId;
}

// The overrideLimit rule that applies to this group right now.
// If several apply, the lowest max wins.
function activeOverride(config: Config, groupId: string, rules: Rule[]) {
  return rules
    .filter((rule) => rule.type === "overrideLimit")
    .filter((rule) => rule.group === groupId && quantity(config, rule.option) > 0)
    .sort((a, b) => a.max - b.max)[0];
}

function checkGroup(config: Config, group: Group, groups: Group[], rules: Rule[]) {
  const violations: Violation[] = [];

  const total = group.options.reduce((sum, o) => sum + quantity(config, o.id), 0);
  const picked = group.options.filter((o) => quantity(config, o.id) > 0);

  const override = activeOverride(config, group.id, rules);
  const max = override ? override.max : group.max;

  const tooFew = total < group.min;
  const tooMany = max !== undefined && total > max;
  const wrongStep = group.step !== undefined && total % group.step !== 0;

  if (override && tooMany) {
    violations.push({
      id: override.id,
      message: `${group.name}: max is ${override.max} when ${optionName(groups, override.option)} is selected`,
    });
  } else if (group.step !== undefined && (tooFew || tooMany || wrongStep)) {
    const range = max === undefined ? `at least ${group.min}` : `${group.min}-${max}`;
    violations.push({
      id: group.id,
      message: `${group.name}: total must be ${range} in steps of ${group.step}`,
    });
  } else if (tooFew) {
    violations.push({ id: group.id, message: `${group.name}: choose at least ${group.min}` });
  } else if (tooMany) {
    violations.push({ id: group.id, message: `${group.name}: choose at most ${max}` });
  }

  if (group.maxDistinct !== undefined && picked.length > group.maxDistinct) {
    violations.push({
      id: group.id,
      message: `${group.name}: choose at most ${group.maxDistinct} different options`,
    });
  }

  for (const option of picked) {
    if (group.maxPerOption !== undefined && quantity(config, option.id) > group.maxPerOption) {
      violations.push({
        id: group.id,
        message: `${group.name}: ${option.name} can be added at most ${group.maxPerOption} time(s)`,
      });
    }
  }

  return violations;
}

function checkRule(config: Config, rule: Rule, groups: Group[]): Violation[] {
  // overrideLimit is handled together with the group limits
  if (rule.type === "overrideLimit" || quantity(config, rule.option) === 0) return [];

  const name = optionName(groups, rule.option);

  if (rule.type === "requires") {
    if (rule.anyOf.some((id) => quantity(config, id) > 0)) return [];

    const needed = rule.anyOf.map((id) => optionName(groups, id)).join(" or ");
    return [{ id: rule.id, message: `${name} requires ${needed}` }];
  }

  const clashes = rule.with.filter((id) => quantity(config, id) > 0);
  if (clashes.length === 0) return [];

  const others = clashes.map((id) => optionName(groups, id)).join(" and ");
  return [{ id: rule.id, message: `${name} cannot be combined with ${others}` }];
}
