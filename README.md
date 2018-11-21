# core-metrics
A static analyzer extension for vscode and .NET Core. Allows you to quickly spot and fix problem areas in your code and to see code quality changes on the fly. Core-metrics is build on top of the excellent roslyn-analyzer.

__NOTE:__ Currently core-metrics only works on windows since bundled roslyn-analyzer files are windows only.

## Metrics
The following metrics are calculated and treshholds can be set for these metrics.

- __Cyclomatic Complexity__:
Maximum cyclomatic complexity, cyclomatic complexity indicates the number of possible branches in the control flow (if, switch/case, for- and while-loop statements.
- __Class Coupling__:
Maximum (external) classed coupled in this method.
- __Depth of Inheritance__:
Maximum depth of inheritance.
- __Lines of Code__:
Maximum lines of code in a single method.
- __Maintainability Index__:
Minimum requirement of maintainability. Based on Halstead volume, class coupling. Between 0 and 100, 100 being the best possible score.

## Settings
Settings can be set in the regular settings panel. ``File -> Preferences -> Settings``. The settings for core-metrics can than be found by searching for ``coremetrics`` or by selecting ``Extensions->Core Metrics Extension`` in the treeview. The threshold values for flagging warnings can be set there.

By default (Entity-Framework) migrations are excluded by excluding the ``Migrations`` folder, this can be changed in the ``coreMetrics.excludedFolders`` setting.

## References
This project is based on the roslyn-analyzer.

- [https://github.com/dotnet/roslyn-analyzers](https://github.com/dotnet/roslyn-analyzers)